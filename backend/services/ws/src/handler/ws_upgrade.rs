use std::sync::Arc;

use axum::{extract::{Path, State, WebSocketUpgrade}, http::StatusCode, response::Response};
use common::{enums::JobStage, jwt_config::decode_jwt};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::AppState;


pub async fn websocket (ws: WebSocketUpgrade, State(state): State<Arc<AppState>>, Path(token): Path<String>) -> Result<Response, StatusCode> {
    let claims = match decode_jwt(&token) {
        Err(err) => {
            eprintln!("Error decoding token");
            return Err(StatusCode::UNAUTHORIZED);
        }
        Ok(claim) => claim
    };
    Ok(ws.on_upgrade(move |socket| async move {
        let (mut sender, mut receiver) = socket.split();
        let (tx, mut rx) = mpsc::unbounded_channel::<String>();
        {
            state.clients.insert(claims.id, tx);
        }
        
    }))
}