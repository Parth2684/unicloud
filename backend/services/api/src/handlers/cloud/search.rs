use std::{collections::HashMap, fmt::Display};

use axum::{
    Extension, Json,
    extract::{Path, Query},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use common::{db_connect::init_db, encrypt::decrypt, jwt_config::Claims};
use entities::cloud_account::{Column as CloudAccColumn, Entity as CloudAccountEntity};
use futures::future::join_all;
use reqwest::Client;
use sea_orm::{ColumnTrait, EntityTrait, FromQueryResult, QueryFilter, QuerySelect};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

use crate::utils::google_search_folder::DriveListResponse;

#[derive(Deserialize)]
pub struct SearchReqBody {
    cloud_accounts: HashMap<Uuid, Option<String>>,
    mime_type: Vec<MimeType>,
}

#[derive(Serialize, Deserialize)]
pub enum MimeType {
    #[serde(rename = "audio/")]
    Audio,
    #[serde(rename = "application/vnd.google-apps.folder")]
    Folder,
    #[serde(rename = "video/")]
    Video,
    #[serde(rename = "image/")]
    Image,
    #[serde(rename = "application/pdf")]
    Pdf,
}

impl Display for MimeType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let json_string = serde_json::to_string(self).unwrap_or_default();
        let json_str = json_string.trim_matches('"');
        f.write_str(json_str)
    }
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum OrderBy {
    ModifiedTime,
    #[serde(rename = "modifiedTime desc")]
    ModifiedTimeDesc,
    QuotaBytesUsed,
    #[serde(rename = "quotaBytesUsed desc")]
    QuotaBytesUsedDesc,
    Starred,
}

impl Display for OrderBy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let json_string = serde_json::to_string(self).unwrap_or_default();
        let json_str = json_string.trim_matches('"');
        f.write_str(json_str)
    }
}

#[derive(FromQueryResult)]
struct DbRes {
    access_token: Vec<u8>,
}

#[derive(Deserialize)]
pub struct SearchQueryParams {
    order_by: Option<OrderBy>,
    parent_folder_id: Option<String>,
}

pub async fn search_google(
    Extension(claims): Extension<Claims>,
    Path(query): Path<String>,
    Query(query_params): Query<SearchQueryParams>,
    Json(body): Json<SearchReqBody>,
) -> Response {
    let db = init_db().await;
    // let ids = body.cloud_accounts.keys().copied().collect::<Vec<Uuid>>();
    // let cloud_accounts = CloudAccountEntity::find()
    //     .filter(CloudAccColumn::Id.is_in(ids))
    //     .filter(CloudAccColumn::UserId.eq(claims.id))
    //     .filter(CloudAccColumn::TokenExpired.eq(false))
    //     .filter(CloudAccColumn::IsDeleted.eq(false))
    //     .select_only()
    //     .column(CloudAccColumn::Id)
    //     .column(CloudAccColumn::AccessToken)
    //     .into_model::<DbRes>()
    //     .all(db)
    //     .await;
    let accs_futures = body
        .cloud_accounts
        .into_iter()
        .map(|(id, next_page_token)| async move {
            (
                CloudAccountEntity::find()
                    .filter(CloudAccColumn::Id.eq(id))
                    .filter(CloudAccColumn::UserId.eq(claims.id))
                    .filter(CloudAccColumn::TokenExpired.eq(false))
                    .filter(CloudAccColumn::IsDeleted.eq(false))
                    .select_only()
                    .column(CloudAccColumn::AccessToken)
                    .into_model::<DbRes>()
                    .one(db)
                    .await,
                next_page_token,
                id,
            )
        });

    let access_next_page_tokens = join_all(accs_futures).await;
    let client = Client::new();
    let google_requests =
        access_next_page_tokens
            .into_iter()
            .filter_map(|(db_res, next_page_token, id)| {
                if let Ok(Some(db)) = db_res {
                    if let Ok(token) = decrypt(&db.access_token) {
                        let mut q = vec![
                            format!("fullText contains '{}'", query),
                            String::from("trashed = false"),
                        ];
                        if !body.mime_type.is_empty() {
                            let mime_filters = body.mime_type
                                    .iter()
                                    .map(|mime| match mime {
                                        MimeType::Audio => "mimeType contains 'audio/'",
                                        MimeType::Folder => "mimeType = 'application/vnd.google-apps.folder'",
                                        MimeType::Video => "mimeType contains 'video/'",
                                        MimeType::Image => "mimeType contains 'image/'",
                                        MimeType::Pdf => "mimeType = 'application/pdf'",
                                    })
                                    .collect::<Vec<_>>()
                                    .join(" or ");

                                q.push(format!("({})", mime_filters));
                        }
                        if let Some(parent_folder_id) = query_params.parent_folder_id.as_ref() {
                            q.push(format!("'{}' in parents", parent_folder_id));
                        }
                        let q = q.join(" and ");
                        let mut params = vec![
                            // ("corpora", String::from("drive")),
                            ("q", q),
                            ("pageSize", String::from("25")),
                            ("fields", String::from("files(id,name,mimeType,parents,size,createdTime,modifiedTime),nextPageToken")),
                            // ("includeItemsFromAllDrives", String::from("true"))
                        ];
                        if let Some(token) = next_page_token.as_deref() {
                            params.push(("pageToken", token.to_owned()));
                        }

                        if let Some(order) = query_params.order_by.as_ref() {
                            params.push(("orderBy", format!("{}", order)));
                        }
                        let client = client.clone();
                        Some(async move {
                            (
                                client
                                    .get("https://www.googleapis.com/drive/v3/files")
                                    .query(&params)
                                    .bearer_auth(token)
                                    .send()
                                    .await,
                                id,
                            )
                        })
                    } else {
                        None
                    }
                } else {
                    None
                }
            });

    let google_responses = join_all(google_requests).await;

    let responses = google_responses
        .into_iter()
        .filter_map(|(response, id)| match response {
            Err(err) => {
                eprintln!("Error getting search res from google: {:?}", err);
                None
            }
            Ok(res) => Some(async move { (res.json::<DriveListResponse>().await, id) }),
        });

    let dlrs = join_all(responses).await;
    let res = dlrs
        .into_iter()
        .filter_map(|(dlr, drive_id)| {
            dbg!(&dlr);
            match dlr {
                Err(err) => {
                    eprintln!("Error parsing dlr from response: {:?}", err);
                    None
                }
                Ok(res) => Some((res, drive_id)),
            }
        })
        .collect::<Vec<(DriveListResponse, Uuid)>>();

    (
        StatusCode::OK,
        Json(json!({
            "search_results": res
        })),
    )
        .into_response()
}

#[test]
fn see_serialize() {
    println!("{}", MimeType::Audio);
    println!("{}", MimeType::Folder);
    println!("{}", MimeType::Image);
    println!("{}", MimeType::Video);
}
