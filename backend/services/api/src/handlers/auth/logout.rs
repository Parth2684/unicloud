use axum::{body::Body, response::{IntoResponse, Redirect, Response}};
use common::export_envs::ENVS;
use oasgen::oasgen;

use crate::impl_oaschema::OaCookieJar;

#[oasgen]
pub async fn logout(jar: OaCookieJar) -> (OaCookieJar, Response<Body>) {
    let jar = jar.remove("auth_token");
    (
        jar,
        Redirect::to(&format!("{}/home", ENVS.frontend_url)).into_response(),
    )
}
