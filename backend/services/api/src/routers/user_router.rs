use axum::routing::get;
use axum::routing::post;
use axum::{Router, middleware};

use crate::handlers::user::{edit_jobs::edit_job, get_jobs::get_jobs, get_quota::get_user_info};
use crate::utils::middleware::auth_middleware;

pub fn user_router() -> Router {
    Router::new()
        .route("/get-jobs", get(get_jobs))
        .route("/edit-job", post(edit_job))
        .route("/get-user-info", get(get_user_info))
        .layer(middleware::from_fn(auth_middleware))
}
