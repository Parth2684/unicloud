use axum::{
    Extension, Json,
    response::{IntoResponse, Response},
};
use common::{db_connect::init_db, jwt_config::Claims};
use entities::quota::{Column as QuotaColumn, Entity as QuotaEntity};
use http::StatusCode;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use serde_json::json;

use crate::utils::app_errors::AppError;

pub async fn get_user_quota(Extension(claims): Extension<Claims>) -> Result<Response, AppError> {
    let db = init_db().await;
    match QuotaEntity::find()
        .filter(QuotaColumn::UserId.eq(claims.id))
        .one(db)
        .await
    {
        Err(err) => {
            eprintln!("{err:?}");
            Err(AppError::Internal(Some(String::from(
                "Error finding user quota",
            ))))
        }
        Ok(quota) => match quota {
            None => Err(AppError::NotFound(Some(String::from(
                "Your quota not found or does not exists please signin again to create one",
            )))),
            Some(quo) => Ok((
                StatusCode::OK,
                Json(json!({
                    "message": "quota found successfully",
                    "quota": quo
                })),
            )
                .into_response()),
        },
    }
}
