use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use oasgen::oasgen;
use serde_json::json;

use crate::impl_oaschema::OaCookieJar;
use crate::utils::app_errors::AppError;

#[oasgen]
pub async fn get_cookie(jar: OaCookieJar) -> Result<Response, AppError> {
    let cookie = jar.get("auth_token");
    match cookie {
        Some(token) => {
            let token_val = token.value();
            Ok((
                StatusCode::OK,
                Json(json!({
                    "auth_token": token_val
                })),
            )
                .into_response())
        }
        None => Err(AppError::NotFound(Some(String::from("Token not found")))),
    }
}
