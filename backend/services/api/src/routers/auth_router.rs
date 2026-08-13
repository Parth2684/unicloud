use axum::{
    Router, middleware,
};
use oasgen::Server;

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
    let protected_routes_openapi = Server::axum()
        .get("/token", get_cookie)
        .get("/drive", drive_auth_redirect)
        .get("/drive/callback", drive_auth_callback)
        .post("/logout", logout)
        .freeze();

    let protected_routes: Router<()> =
            protected_routes_openapi.into_router()
            .layer(middleware::from_fn(auth_middleware));
    
    let unprotected_routes_openapi = Server::axum()
        .get("/google", google_auth_redirect)
        .get("/google/callback", google_auth_callback)
        .freeze();

    let unprotected_routes: Router<()> =
            unprotected_routes_openapi.into_router();
    
    Router::new()
        .merge(protected_routes)
        .merge(unprotected_routes)
}
