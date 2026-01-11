use redis::AsyncTypedCommands;
use serde::Serialize;
use common::{enums::JobStage, redis_connection::init_redis};
use uuid::Uuid;

#[derive(Serialize)]
struct JobProgress {
    user_id: Uuid,
    job_id: Uuid,
    stage: JobStage,
    message: String,
    progress: u8
}

pub async fn progress_pub(user_id: &Uuid, job_id: &Uuid, stage: JobStage, message: &str, progress: u8) {
    let mut redis_conn = init_redis().await;
    match serde_json::to_string(&JobProgress {
        user_id: user_id.to_owned(),
        job_id: job_id.to_owned(),
        stage: stage,
        message: message.to_owned(),
        progress: progress
    }) {
        Err(err) => eprintln!("error serializing progress: {err:?}"),
        Ok(job) => {
            let channel = format!("job:progress:{}", job_id);
            redis_conn.publish(channel, job).await.ok();
        }
    };
    
}