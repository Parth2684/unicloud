use serde::Serialize;

#[derive(Serialize)]
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
