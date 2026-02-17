use std::{collections::HashMap, sync::Arc};

use common::export_envs::ENVS;
use futures_util::StreamExt;
use tokio::sync::{Mutex, broadcast};

pub type JobId = String;
pub type JobBus = Arc<Mutex<HashMap<JobId, broadcast::Sender<String>>>>;

pub async fn listen(bus: JobBus) {
    let redis_url = &ENVS.redis_url;
    let redis_client = redis::Client::open(redis_url.as_str()).unwrap();
    let mut conn = redis_client.get_async_pubsub().await.unwrap();

    conn.psubscribe("job:progress:*").await.unwrap();
    let mut stream = conn.on_message();

    while let Some(msg) = stream.next().await {
        let channel = msg.get_channel_name();
        let payload: String = match msg.get_payload() {
            Ok(p) => p,
            Err(e) => {
                eprintln!("❌ Redis payload error: {e}");
                continue;
            }
        };

        let Some(job_id) = channel.strip_prefix("job:progress:") else {
            eprintln!("❌ Failed to parse job id from channel: {channel}");
            continue;
        };

        let bus = bus.lock().await;

        if let Some(tx) = bus.get(job_id) {
            let _ = tx.send(payload);
        } else {
            eprintln!("⚠️ No subscribers for job {job_id}");
        }
    }
}

pub async fn subscribe_job(bus: &JobBus, job_id: &str) -> broadcast::Receiver<String> {
    let mut bus = bus.lock().await;
    bus.entry(job_id.to_owned())
        .or_insert_with(|| broadcast::channel(64).0)
        .subscribe()
}
