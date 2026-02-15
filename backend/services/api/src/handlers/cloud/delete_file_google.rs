use axum::Extension;
use common::jwt_config::Claims;

pub async fn delete_file_google(Extension(claims): Extension<Claims>) {}
