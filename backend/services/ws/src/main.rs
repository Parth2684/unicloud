use std::{collections::HashMap, sync::Arc};

use axum::{Router, routing::any};
use common::{db_connect::init_db, export_envs::ENVS};
use dashmap::DashMap;
use redis::aio::{PubSub};
use sea_orm::DatabaseConnection;
use tokio::sync::{Mutex, RwLock, mpsc};
use uuid::Uuid;

use crate::handler::{progress_sub::subscribe, ws_upgrade::websocket};


mod handler;

#[derive(Clone)]
struct AppState {
    db: DatabaseConnection,
    pubsub: Arc<Mutex<PubSub>>,
    clients: Arc<DashMap<Uuid, mpsc::UnboundedSender<String>>>
}


#[tokio::main]
async fn main() {
    let redis_url = &ENVS.redis_url.to_owned();
    let redis_client = redis::Client::open(redis_url.as_str()).expect("Error getting redis client");
    
    let (db, pubsub) = tokio::join!(
        init_db(), redis_client.get_async_pubsub());

    let pubsub = pubsub.unwrap();

    let appstate = Arc::new(AppState{ db: db.clone().to_owned(), pubsub: Arc::new(Mutex::new(pubsub)), clients: Arc::new(DashMap::new()) });

    tokio::spawn(subscribe(Arc::clone(&appstate)));
    let app: Router<Arc<AppState>> = Router::new()
        .route("/ws/{token}", any(websocket))
        .with_state(Arc::clone(&appstate));
    
}
