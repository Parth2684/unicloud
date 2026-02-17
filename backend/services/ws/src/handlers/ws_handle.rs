use axum::extract::ws::{CloseFrame, Message, Utf8Bytes, WebSocket};
use common::jwt_config::decode_jwt;
use futures_util::{sink::SinkExt, stream::StreamExt};
use redis::AsyncTypedCommands;

use entities::{
    job::{Column as JobColumn, Entity as JobEntity},
    sea_orm_active_enums::Status,
};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::mpsc;

use crate::{AppState, JOB_BUS, handlers::helpers::subscriber::subscribe_job};

pub async fn handle_socket(socket: WebSocket, state: AppState, params: HashMap<String, String>) {
    let token = match params.get("token") {
        Some(t) => t,
        None => return,
    };

    let claims = match decode_jwt(token) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("JWT error: {e}");
            return;
        }
    };

    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();
    // tokio::spawn(async move {
    //     while let Some(msg) = rx.recv().await {
    //         if sender.send(Message::Text(msg.into())).await.is_err() {
    //             break;
    //         }
    //     }
    // });
    tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            match sender.send(Message::Text(msg.into())).await {
                Err(err) => {
                    eprintln!("{err:?}");
                    break
                }
                Ok(_) => continue
            } 
        } 
    });
    // if sender
    //     .send(Message::Text("ws-connected".into()))
    //     .await
    //     .is_err()
    // {
    //     eprintln!("❌ Failed to send initial WS message");
    //     return;
    // }
    if let Ok(jobs) = JobEntity::find()
        .filter(JobColumn::UserId.eq(claims.id))
        .filter(JobColumn::Status.eq(Status::Running))
        .all(state.db)
        .await
    {
        for job in jobs {
            let job_id = job.id.to_string();
            let tx_clone = tx.clone();

            // Send initial snapshot immediately
            let snapshot = serde_json::json!({
                "type": "snapshot",
                "job_id": job_id,
                "stage": job.status
            });
            let _ = tx_clone.send(snapshot.to_string());

            tokio::spawn(async move {
                let mut rx_bus = subscribe_job(&JOB_BUS, &job_id).await;
                
                while let Ok(msg) = rx_bus.recv().await {
                    println!("{:?}", msg);
                    if tx_clone.send(msg.clone()).is_err() {
                        break;
                    }

                    // Stop listening when job completes
                    if let Ok(val) = serde_json::from_str::<serde_json::Value>(&msg) {
                        if matches!(
                            val.get("stage").and_then(|v| v.as_str()),
                            Some("Completed") | Some("Failed")
                        ) {
                            break;
                        }
                    }
                }
            });
        }
    }

    while let Some(Ok(msg)) = receiver.next().await {
        if let Message::Text(text) = msg {
            match text.as_str() {
                "Refresh Token" => {
                    let mut redis = state.redis.clone();
                    let redis = Arc::make_mut(&mut redis);

                    if let Ok(added) = redis
                        .hset_nx("dedupe:queue", claims.id.to_string(), "1")
                        .await
                    {
                        if added {
                            let _ = redis.lpush("refresh:queue", claims.id.to_string()).await;
                        }
                    }
                }
                _ => {}
            }
        }
    }
    
}
