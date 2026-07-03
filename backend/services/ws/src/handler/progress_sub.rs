use std::sync::Arc;

use common::enums::JobStage;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::AppState;


#[derive(Serialize, Deserialize)]
struct JobProgress {
    user_id: Uuid,
    job_id: Uuid,
    stage: JobStage,
    message: String,
    progress: u8,
}


pub async fn subscribe(state: Arc<AppState>) {
    let mut pubsub = {
        state.pubsub.lock().await
    };
    match pubsub.psubscribe("job:progress:*").await {
        Err(err) => {
            eprintln!("Error connecting to pubsub: {:?}", err);
            return;
        }
        Ok(_) => ()
    };

    let mut stream = pubsub.on_message();

    while let Some(message) = stream.next().await {
        let payload: String = match message.get_payload() {
            Ok(pay) => pay,
            Err(err) => {
                eprintln!("Error getting payload: {:?} ", err);
                continue;
            }
        };

        let job = match serde_json::from_str::<JobProgress>(&payload) {
            Err(err) => {
                eprintln!("Error parsing job: {:?}, message: {:?}", err, payload);
                continue;
            }
            Ok(j) => j
        };
    }
}