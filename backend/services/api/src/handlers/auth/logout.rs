use axum::response::{IntoResponse, Redirect};
use axum_extra::extract::CookieJar;
use common::export_envs::ENVS;




pub async fn logout(jar: CookieJar) -> impl IntoResponse {
    let jar = jar.remove("auth_token");
    (jar, Redirect::to(&format!("{}/home", &ENVS.frontend_url)).into_response())
}