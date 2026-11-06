use axum::http::StatusCode;
use axum::{
    Extension, Json,
    response::{IntoResponse, Response},
};
use common::{db_connect::init_db, encrypt::decrypt, jwt_config::Claims};
use entities::cloud_account::{Column as CloudAccountColumn, Entity as CloudAccountEntity};
use reqwest::Client;
use sea_orm::{ColumnTrait, EntityTrait, FromQueryResult, QueryFilter, QuerySelect};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

use crate::utils::{app_errors::AppError, google_search_folder::DriveFile};

#[derive(Deserialize)]
pub struct GoogleFolderCreate {
    drive_id: Uuid,
    parent_id: String,
    folder_name: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RequestBody {
    name: String,
    mime_type: String,
    parents: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ResponseBody {
    id: String,
    name: String,
    created_at: Option<String>,
    modified_at: Option<String>,
}

#[derive(FromQueryResult)]
struct DbRes {
    access_token: Vec<u8>
}

pub async fn google(
    Extension(claims): Extension<Claims>,
    Json(body): Json<GoogleFolderCreate>,
) -> Result<Response, AppError> {
    let db = init_db().await;
    let cloud_acc = CloudAccountEntity::find()
        .filter(CloudAccountColumn::Id.eq(body.drive_id))
        .filter(CloudAccountColumn::UserId.eq(claims.id))
        .select_only()
        .column(CloudAccountColumn::AccessToken)
        .into_model::<DbRes>()
        .one(db)
        .await;

    if let Ok(Some(acc)) = cloud_acc {
        let access_token = decrypt(&acc.access_token);
        if let Ok(token) = access_token {
            let request_body = RequestBody {
                name: body.folder_name,
                mime_type: String::from("application/vnd.google-apps.folder"),
                parents: vec![body.parent_id.clone()],
            };
            let client = Client::new();
            let google_res = client
                .post("https://www.googleapis.com/drive/v3/files")
                .bearer_auth(token)
                .header("Content-Type", "application/json")
                .json(&request_body)
                .send()
                .await
                .map_err(|err| {
                    eprintln!("error getting respnse from google: {:?}", err);
                    AppError::BadGateway(Some(String::from("Error gettting response from google")))
                })?;
            let res = google_res.json::<ResponseBody>().await;
            match res {
                Err(err) => {
                    eprintln!("error parsing respnse from google: {:?}", err);
                    Ok((
                        StatusCode::NO_CONTENT,
                        Json(json!({
                            "message": "Please reload the page folder creation cannot be confirmed"
                        })),
                    )
                        .into_response())
                }
                Ok(res_body) => Ok((
                    StatusCode::OK,
                    Json(json!({
                        "folder": DriveFile {
                            id: res_body.id,
                            name: res_body.name,
                            mime_type: String::from("application/vnd.google-apps.folder"),
                            parents: Some(vec![body.parent_id]),
                            size: None,
                            created_time: res_body.created_at,
                            modified_time: res_body.modified_at
                        }
                    })),
                )
                    .into_response()),
            }
        } else {
            Err(AppError::Forbidden(None))
        }
    } else {
        Err(AppError::Forbidden(None))
    }
}
