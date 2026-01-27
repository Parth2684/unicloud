use serde::Serialize;

#[derive(Serialize, Debug)]
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
