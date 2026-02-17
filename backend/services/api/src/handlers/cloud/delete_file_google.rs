use axum::{Extension, Json, extract::Path, http::StatusCode, response::{IntoResponse, Response}};
use common::{db_connect::init_db, encrypt::decrypt, jwt_config::Claims};
use reqwest::Client;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use serde_json::json;
use uuid::Uuid;
use entities::{cloud_account::{Column as CloudColumn, Entity as CloudEntity}, sea_orm_active_enums::Provider};

use crate::utils::app_errors::AppError;

pub async fn delete_file_google(Extension(claims): Extension<Claims>, Path((drive_id, file_id)): Path<(Uuid, String)>) -> Result<Response, AppError> {
    let db = init_db().await;
    let cloud_account = CloudEntity::find()
        .filter(CloudColumn::UserId.eq(claims.id))
        .filter(CloudColumn::Id.eq(drive_id))
        .filter(CloudColumn::IsDeleted.eq(false))
        .filter(CloudColumn::TokenExpired.eq(false))
        .filter(CloudColumn::Provider.eq(Provider::Google))
        .one(db)
        .await;
    
    if let Ok(Some(acc)) = cloud_account {
        match decrypt(&acc.access_token) {
            Err(_) => Err(AppError::Forbidden(Some(String::from("Error decrypting access token please try refreshing the account")))),
            Ok(token) => {
                let client = Client::new();
                match client.delete(format!("https://www.googleapis.com/drive/v3/files/{}", file_id)).bearer_auth(token).send().await {
                    Err(err) => {
                        eprintln!("{err:?}");
                        Err(AppError::BadGateway(Some(String::from("Error deleting the file"))))
                    }
                    Ok(_) => {
                        Ok((StatusCode::OK, Json(json!({
                            "message": "file deleted"
                        }))).into_response())
                    }
                }
            }
        }
    }else {
        Err(AppError::Internal(Some(String::from("Error finding your account"))))
    }
}
