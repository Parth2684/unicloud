use axum::{
    Extension, Json,
    extract::Path,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use common::{db_connect::init_db, jwt_config::Claims};
use entities::cloud_account::{
    ActiveModel as CloudActive, Column as CloudColumn, Entity as CloudEntity,
};
use sea_orm::{ActiveModelTrait, ActiveValue::Set, ColumnTrait, EntityTrait, QueryFilter};
use serde_json::json;
use uuid::Uuid;

use crate::utils::app_errors::AppError;

pub async fn remove_google_drive(
    Extension(claims): Extension<Claims>,
    Path(drive_id): Path<Uuid>,
) -> Result<Response, AppError> {
    let db = init_db().await;
    match CloudEntity::find()
        .filter(CloudColumn::UserId.eq(claims.id))
        .filter(CloudColumn::Id.eq(drive_id))
        .one(db)
        .await
    {
        Err(err) => {
            eprintln!("{err:?}");
            Err(AppError::Internal(Some(String::from(
                "Error connecting to database",
            ))))
        }
        Ok(acc) => match acc {
            None => Err(AppError::Internal(Some(String::from(
                "Error finding your account",
            )))),
            Some(acc) => {
                let mut del_acc: CloudActive = acc.into();
                del_acc.is_deleted = Set(true);
                del_acc.refresh_token = Set(None);
                match del_acc.update(db).await {
                    Err(err) => {
                        eprintln!("{err:?}");
                        Err(AppError::Internal(Some(String::from(
                            "Error deleting your account",
                        ))))
                    }
                    Ok(_) => Ok((
                        StatusCode::OK,
                        Json(json!({"message": "successfully deleted your account"})),
                    )
                        .into_response()),
                }
            }
        },
    }
}
