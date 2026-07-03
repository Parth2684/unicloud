use std::{sync::Arc};

use axum::{Router, routing::any};
use common::{export_envs::ENVS, redis_connection::init_redis};
use dashmap::DashMap;
use redis::aio::{ConnectionManager, PubSub};
use tokio::{net::TcpListener, sync::{Mutex, mpsc}};
use uuid::Uuid;

use crate::handler::{progress_sub::subscribe, ws_upgrade::websocket};


mod handler;

#[derive(Clone)]
struct AppState {
    pubsub: Arc<Mutex<PubSub>>,
    clients: Arc<DashMap<Uuid, mpsc::UnboundedSender<String>>>,
    redis: ConnectionManager
}


#[tokio::main]
async fn main() {
    let redis_url = &ENVS.redis_url.to_owned();
    let redis_client = redis::Client::open(redis_url.as_str()).expect("Error getting redis client");
    
    let (pubsub, redis) = tokio::join!(
        redis_client.get_async_pubsub(), init_redis());

    let pubsub = pubsub.unwrap();

    let appstate = Arc::new(AppState{ pubsub: Arc::new(Mutex::new(pubsub)), clients: Arc::new(DashMap::new()), redis });

    tokio::spawn(subscribe(Arc::clone(&appstate)));
    let app = Router::new()
        .route("/ws/{token}", any(websocket))
        .with_state(Arc::clone(&appstate));

    let listener = TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
