use serde::{Deserialize, Serialize};

#[derive(Serialize, Debug, Deserialize)]
pub enum JobStage {
    Started,
    Auth,
    Permissions,
    Sharing,
    Copying,
    Finalizing,
    Completed,
    Failed,
}
