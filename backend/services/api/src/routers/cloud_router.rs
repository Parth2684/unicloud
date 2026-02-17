use axum::{
    Router, middleware,
    routing::{delete, get, post},
};

use crate::{
    handlers::cloud::{
        copy_google::copy_file_or_folder,
        delete_file_google::delete_file_google,
        get_cloud_accounts::get_cloud_accounts,
        get_shared_drive::get_shared_drives,
        google_get_folders::{google_get_folders, google_get_root},
        remove_google_account::remove_google_drive,
    },
    utils::middleware::auth_middleware,
};

pub fn cloud_router() -> Router {
    Router::new()
        .route("/get-cloud-accounts", get(get_cloud_accounts))
        .route("/google/root/{drive_id}", get(google_get_root))
        .route(
            "/google/folder/{drive_id}/{folder_id}",
            get(google_get_folders),
        )
        .route("/google/shared_drive/{drive_id}", get(get_shared_drives))
        .route("/google/google-copy", post(copy_file_or_folder))
        .route(
            "/google/delete-drive/{drive_id}",
            delete(remove_google_drive),
        )
        .route(
            "/google/delete-file/{drive_id}/{file_id}",
            delete(delete_file_google),
        )
        .layer(middleware::from_fn(auth_middleware))
}
