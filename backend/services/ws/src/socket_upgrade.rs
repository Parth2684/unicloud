use std::collections::HashMap;

use axum::{
    extract::{
        ws::{WebSocketUpgrade},
        State, Query,
    },
    response::IntoResponse,
};

use crate::handlers::ws_handle::handle_socket;
use crate::AppState;

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Query(params): Query<HashMap<String, String>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state, params))
}
