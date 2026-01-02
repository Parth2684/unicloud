use common::db_connect::init_db;
use entities::{job::{ActiveModel as JobActive, Column as JobColumn, Entity as JobEntity}, sea_orm_active_enums::Status};
use reqwest::{Client, StatusCode};
use sea_orm::{ActiveModelTrait, ActiveValue::Set, ColumnTrait, EntityTrait, QueryFilter, prelude::Uuid};
use serde::Deserialize;
use serde_json::json;

pub async fn create_permission(token: &str, file_id: &str, email_id: &str) -> Result<(), String> {
    let client = Client::new();

    let response = client
        .post(format!(
            "https://www.googleapis.com/drive/v3/files/{file_id}/permissions"
        ))
        .bearer_auth(token)
        .json(&json!({
            "type": "user",
            "role": "writer",
            "emailAddress": email_id
        }))
        .send()
        .await;

    match response {
        Err(err) => {
            eprintln!("{err:?}");
            if err.status() == Some(StatusCode::FORBIDDEN) {
                return Err(String::from(
                    "You might not have editor or owner role to the file",
                ));
            } else {
                return Err(String::from(
                    "Error from google api giving permissions, please try again",
                ));
            }
        }
        Ok(_) => return Ok(()),
    }
}

#[derive(Deserialize, Clone)]
struct Permission {
    id: String,
}

#[derive(Deserialize, Clone)]
struct PermissionApiRes {
    permissions: Vec<Permission>,
}

pub async fn copy_file(
    dest_token: &str,
    file_id: &str,
    dest_folder_id: &str,
    job_id: &Uuid,
) -> Result<Vec<String>, String> {
    let db = init_db().await;
    let client = Client::new();
    let response = client
        .post(format!(
            "https://www.googleapis.com/drive/v3/files/{file_id}/copy"
        ))
        .bearer_auth(dest_token)
        .json(&json!({
            "parents": vec![dest_folder_id]
        }))
        .send()
        .await;
    
    match response {
        Err(err) => {
            eprintln!("{err:?}");
            return Err(String::from("Error copying file, try again"));
        }
        Ok(res) => match res.json::<PermissionApiRes>().await {
            Err(err) => {
                eprintln!("{err:?}");
                return Err(String::from("Error parsing response from google"));
            }
            Ok(r) => {
                let job = JobEntity::find()
                    .filter(JobColumn::Id.eq(job_id.to_owned()))
                    .one(db)
                    .await;

                if let Ok(Some(j)) = job {
                    let mut edit_job: JobActive = j.into();
                    let mut permission_ids: Vec<String> = Vec::new();
                    r.permissions.iter().for_each(|permission| {
                        permission_ids.push(permission.id.clone());
                    });
                    edit_job.permission_id = Set(Some(permission_ids));
                    edit_job.status = Set(Status::Completed);
                    edit_job.update(db).await.ok();
                    Ok(permission_ids)
                } else {
                    return Err(String::from("error getting permission ids"));
                }
            }
        },
    }
}


pub async fn remove_permission (permission_ids: Vec<String>) {
    
}
