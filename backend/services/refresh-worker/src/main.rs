use axum::{Router, routing::get};
use common::{db_connect::init_db, redis_connection::init_redis};
use redis::{AsyncTypedCommands, RedisError};
use tokio::net::TcpListener;
use uuid::Uuid;

use crate::handle_refresh::handle_refresh;
mod handle_refresh;

#[tokio::main]
async fn main() {
    let listener = TcpListener::bind("0.0.0.0:3001").await.unwrap();

    let app: Router<()> = Router::new().route("/", get(|| async { "Noice" }));

    tokio::spawn(async {
        let mut redis_conn = init_redis().await;
        let db = init_db().await;
        loop {
            let result: Result<Option<String>, RedisError> = redis_conn
                .brpoplpush("refresh:queue", "refresh:queue", 5.0)
                .await;

            let result = match result {
                Ok(some_str) => match some_str {
                    Some(str) => str,
                    None => continue,
                },
                Err(err) => {
                    eprintln!("{err:?}");
                    continue;
                }
            };
            let id = match Uuid::parse_str(&result) {
                Ok(uid) => uid,
                Err(err) => {
                    eprintln!("{err:?}");
                    continue;
                }
            };

            let should_retry = handle_refresh(id, db).await;
            if !should_retry {
                redis_conn.lrem("refresh:queue", 1, &result).await.ok();
                redis_conn.hdel("dedupe:queue", &result).await.ok();
            }
        }
    });

    println!("refresh worker running on port 3001");
    axum::serve(listener, app).await.unwrap();
}
