use common::jwt_config::decode_jwt;
use futures_channel::mpsc::unbounded;
use futures_util::{SinkExt, StreamExt};
use redis::{AsyncTypedCommands, aio::ConnectionManager};

use entities::{
    job::{Column as JobColumn, Entity as JobEntity},
    sea_orm_active_enums::Status,
};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};
use tokio::net::TcpStream;
use tokio_tungstenite::{
    accept_hdr_async,
    tungstenite::{
        Message,
        handshake::server::{Request, Response},
    },
};
use url::Url;

use crate::{JOB_BUS, handlers::helpers::subscriber::subscribe_job};

pub async fn accept_connection(
    stream: TcpStream,
    mut conn: Arc<ConnectionManager>,
    db: &DatabaseConnection,
) {
    let request_url = Arc::new(Mutex::new(None::<Url>));
    let url_store = request_url.clone();

    let callback = move |req: &Request, res: Response| {
        let url = req.uri();
        let full_url = format!("ws://localhost:8080{:?}", url);
        match Url::parse(&full_url) {
            Ok(parsed) => {
                if let Ok(mut guard) = url_store.lock() {
                    *guard = Some(parsed);
                } else {
                    return Err(Response::builder()
                        .status(500)
                        .body(Some("Internal lock error".into()))
                        .unwrap());
                }
                Ok(res)
            }

            Err(err) => {
                eprintln!("{err:?}");
                Err(Response::builder()
                    .status(400)
                    .body(Some("Invalid Url".into()))
                    .unwrap())
            }
        }
    };

    let ws_stream = match accept_hdr_async(stream, callback).await {
        Ok(ws) => ws,
        Err(e) => {
            eprintln!("Handshake error: {e:?}");
            return;
        }
    };

    let url_opt = {
        match request_url.lock() {
            Ok(guard) => guard.clone(),
            Err(err) => {
                eprintln!("{err}");
                return;
            }
        }
    };
    match url_opt {
        None => {
            return;
        }
        Some(url) => {
            let mut pairs: HashMap<String, String> = HashMap::new();
            let queries = url.query_pairs();

            for query in queries {
                pairs.insert(query.0.to_string(), query.1.to_string());
            }

            let token = match pairs.get("token") {
                None => return,
                Some(tok) => tok.to_owned(),
            };

            let (mut sender, mut receiver) = ws_stream.split();
            let (ws_tx, mut ws_rx) = unbounded::<Message>();

            tokio::spawn(async move {
                while let Some(msg) = ws_rx.next().await {
                    if sender.send(msg).await.is_err() {
                        break;
                    }
                }
            });

            let claims = match decode_jwt(&token) {
                Ok(claim) => claim,
                Err(err) => {
                    eprintln!("error decoding jwt: {}", err);
                    // sender
                    //     .send(Message::Text(Utf8Bytes::from(String::from(
                    //         "Error Validating User from the websocket server",
                    //     ))))
                    //     .await
                    //     .ok();
                    return;
                }
            };
            while let Some(msg) = receiver.next().await {
                let msg = match msg {
                    Ok(m) => m,
                    Err(e) => {
                        eprintln!("{e:?}");
                        break;
                    }
                };

                if msg.is_text() {
                    let text = msg.to_text();
                    let text = match text {
                        Ok(str) => str.to_owned(),
                        Err(err) => {
                            // sender
                            //     .send(Message::Text(Utf8Bytes::from(format!("Server got {err}"))))
                            //     .await
                            //     .ok();
                            eprintln!("{err:?}");
                            break;
                        }
                    };
                    if text == String::from("Refresh Token") {
                        let redis_clone = Arc::make_mut(&mut conn);
                        let added = redis_clone
                            .hset_nx("dedupe:queue", claims.id.to_string(), "1")
                            .await;
                        match added {
                            Ok(add) => {
                                if add {
                                    let _ = redis_clone
                                        .lpush("refresh:queue", claims.id.to_string())
                                        .await;
                                }
                            }
                            Err(err) => {
                                eprintln!("error connecting to redis {err}");
                                break;
                            }
                        }
                    }
                    if text == String::from("Transfer Status") {
                        let running_jobs = JobEntity::find()
                            .filter(JobColumn::UserId.eq(claims.id))
                            .filter(JobColumn::Status.eq(Status::Running))
                            .all(db)
                            .await;
                        if let Ok(jobs) = running_jobs {
                            let jobs: Vec<String> =
                                jobs.iter().map(|job| job.id.to_string()).collect();
                            for job in jobs {
                                let ws_tx_clone = ws_tx.clone();
                                tokio::spawn(async move {
                                    let mut rx = subscribe_job(&JOB_BUS, &job).await;
                                    while let Ok(msg) = rx.recv().await {
                                        match serde_json::from_str::<serde_json::Value>(&msg).ok() {
                                            None => (),
                                            Some(val) => {
                                                if ws_tx_clone
                                                    .unbounded_send(Message::Text(msg.into()))
                                                    .is_err()
                                                {
                                                    println!("closing websocket");
                                                    break;
                                                };
                                                if val.get("stage")
                                                    == Some(&serde_json::Value::String(
                                                        String::from("Completed"),
                                                    ))
                                                    || val.get("stage")
                                                        == Some(&serde_json::Value::String(
                                                            String::from("Failed"),
                                                        ))
                                                {
                                                    let mut job = JOB_BUS.lock().await;
                                                    job.remove(
                                                        val.get("id").unwrap().as_str().unwrap(),
                                                    );
                                                    println!("job unsubscribed")
                                                }
                                            }
                                        };
                                    }
                                });
                            }
                        }
                    }
                }
            }
            // match peer_map.lock() {
            //     Ok(mut peer) => peer.remove(&addr),
            //     Err(err) => {
            //         eprintln!("{err:?}");
            //         return;
            //     }
            // };
        }
    }
}
