use crate::{
    handlers::helpers::subscriber::{JobBus, listen},
    socket_upgrade::ws_handler,
};
use axum::{Router, routing::get};
use common::{db_connect::init_db, export_envs::ENVS, redis_connection::init_redis};
use once_cell::sync::Lazy;
use redis::aio::ConnectionManager;
use sea_orm::DatabaseConnection;
use std::{collections::HashMap, sync::Arc, time::Duration};
use tokio::{sync::Mutex as TokioMutex, time::interval};


mod handlers;
mod socket_upgrade;

#[derive(Clone)]
pub struct AppState {
    redis: Arc<ConnectionManager>,
    db: &'static DatabaseConnection,
}

pub static JOB_BUS: Lazy<JobBus> = Lazy::new(|| Arc::new(TokioMutex::new(HashMap::new())));

#[tokio::main]
async fn main() {
    let manager = init_redis().await;
    let redis = Arc::new(manager);
    let db = init_db().await;

    let state = AppState { redis, db };
    tokio::spawn(listen(JOB_BUS.clone()));
    tokio::spawn(async {
        let mut ticker = interval(Duration::from_secs(10));
        loop {
            ticker.tick().await;
            let client = reqwest::Client::new();
            println!("{:?}", client.get(format!("{}/", &ENVS.transfer)).send().await.ok());
            println!("{:?}", client.get(format!("{}/", &ENVS.refresh)).send().await.ok());
        }
    });
    
    let app: Router<()> = Router::new()
        .route("/", get(|| async { "Noice" }))
        .route("/ws", get(ws_handler))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", &ENVS.port)).await.unwrap();
    println!("Server running on port {}", &ENVS.port);
    axum::serve(listener, app.into_make_service()).await.unwrap();
}
