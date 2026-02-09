use crate::handlers::{
    helpers::subscriber::{JobBus, listen},
    ws_handle::accept_connection,
};
use common::{db_connect::init_db, redis_connection::init_redis, export_envs::ENVS};
use once_cell::sync::Lazy;
use std::{collections::HashMap, fmt::Error, sync::Arc};
use tokio::{net::TcpListener, sync::Mutex as TokioMutex};

mod handlers;

pub static JOB_BUS: Lazy<JobBus> = Lazy::new(|| Arc::new(TokioMutex::new(HashMap::new())));

#[tokio::main]
async fn main() -> Result<(), Error> {
    let addr = format!("0.0.0.0:{}", &ENVS.port);
    let try_socket = TcpListener::bind(&addr).await;
    let listner = try_socket.expect("Failed to bind");
    println!("Listeneing on {:?}", addr);
    let manager = init_redis().await;
    let redis = Arc::new(manager);
    let db = init_db().await;

    tokio::spawn(listen(JOB_BUS.clone()));

    while let Ok((stream, _)) = listner.accept().await {
        let conn = Arc::clone(&redis);
        tokio::spawn(accept_connection(stream, conn, db));
    }
    Ok(())
}
