use axum::extract::ws::{Message, WebSocket};
use common::jwt_config::decode_jwt;
use futures_util::{sink::SinkExt, stream::StreamExt};
use redis::AsyncTypedCommands;

use entities::{
    job::{Column as JobColumn, Entity as JobEntity},
    sea_orm_active_enums::Status,
};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::Mutex;

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

    let (sender, mut receiver) = socket.split();
    let sender = Arc::new(Mutex::new(sender));

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

                "Transfer Status" => {
                    let jobs = JobEntity::find()
                        .filter(JobColumn::UserId.eq(claims.id))
                        .filter(JobColumn::Status.eq(Status::Running))
                        .all(state.db)
                        .await;

                    if let Ok(jobs) = jobs {
                        for job in jobs {
                            let job_id = job.id.to_string();
                            let sender = sender.clone();
                            tokio::spawn(async move {
                                let mut rx = subscribe_job(&JOB_BUS, &job_id).await;

                                while let Ok(msg) = rx.recv().await {
                                    let mut ws = sender.lock().await;
                                    if ws.send(Message::Text(msg.clone().into())).await.is_err() {
                                        break;
                                    }

                                    if let Ok(val) = serde_json::from_str::<serde_json::Value>(&msg)
                                    {
                                        if matches!(
                                            val.get("stage").and_then(|v| v.as_str()),
                                            Some("Completed") | Some("Failed")
                                        ) {
                                            JOB_BUS.lock().await.remove(&job_id);
                                            break;
                                        }
                                    }
                                }
                            });
                        }
                    }
                }

                _ => {}
            }
        }
    }
}
