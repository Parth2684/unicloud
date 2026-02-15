use std::collections::HashMap;

use axum::{
    extract::{Query, State, ws::WebSocketUpgrade},
    response::IntoResponse,
};

use crate::AppState;
use crate::handlers::ws_handle::handle_socket;

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Query(params): Query<HashMap<String, String>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state, params))
}
