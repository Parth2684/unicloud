use axum::{
    Router, middleware,
    routing::{get, post},
};

use crate::{
    handlers::auth::{
        add_google_drive::{drive_auth_callback, drive_auth_redirect},
        get_cookie::get_cookie,
        login_with_google::{google_auth_callback, google_auth_redirect},
        logout::logout,
    },
    utils::middleware::auth_middleware,
};

pub fn auth_routes() -> Router {
    let protected_routes = Router::new()
        .route("/token", get(get_cookie))
        .route("/drive", get(drive_auth_redirect))
        .route("/drive/callback", get(drive_auth_callback))
        .route("/logout", post(logout))
        .layer(middleware::from_fn(auth_middleware));

    Router::new()
        .merge(protected_routes)
        .route("/google", get(google_auth_redirect))
        .route("/google/callback", get(google_auth_callback))
}
