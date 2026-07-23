use std::sync::Arc;

use axum::{
    extract::{Path, State, WebSocketUpgrade, ws::Message},
    http::StatusCode,
    response::Response,
};
use common::jwt_config::decode_jwt;
use futures_util::{SinkExt, StreamExt};
use redis::AsyncTypedCommands;
use tokio::sync::mpsc;

use crate::AppState;

pub async fn websocket(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
    Path(token): Path<String>,
) -> Result<Response, StatusCode> {
    let claims = match decode_jwt(&token) {
        Err(err) => {
            eprintln!("Error decoding token: {:?}", err);
            return Err(StatusCode::UNAUTHORIZED);
        }
        Ok(claim) => claim,
    };
    Ok(ws.on_upgrade(move |socket| async move {
        let (mut sender, mut receiver) = socket.split();
        let (tx, mut rx) = mpsc::unbounded_channel::<String>();
        {
            state.clients.insert(claims.id, tx);
        }

        loop {
            tokio::select! {
                Some(msg) = rx.recv() => {
                    if sender.send(Message::Text(msg.into())).await.is_err() {
                        break;
                    }
                }

                msg = receiver.next() => {
                    match msg {
                        Some(Ok(message)) => {
                            if let Message::Text(text) = message {
                                match text.as_str() {
                                    "Refresh Token" => {
                                        let mut redis = state.redis.clone();
                                        if let Ok(added) = redis
                                            .hset_nx("dedupe:queue", claims.id.to_string(), "1")
                                            .await
                                        {
                                            if added {
                                                let _ = redis.lpush("refresh:queue", claims.id.to_string()).await;
                                            }
                                        }
                                    }
                                    _ => ()
                                };
                            };

                        }
                        _ => {
                            break;
                        }
                    }
                }
            }
        }

        {
            state.clients.remove(&claims.id);
        }
    }))
}
