use common::db_connect::init_db;
use entities::{
    job::{ActiveModel as JobActive, Column as JobColumn, Entity as JobEntity},
    sea_orm_active_enums::Status,
};
use reqwest::{Client, StatusCode};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, EntityTrait, QueryFilter, prelude::Uuid,
};
use serde::Deserialize;
use serde_json::json;

pub async fn create_permission(
    token: &str,
    file_id: &str,
    email_id: &str,
    job_id: &Uuid,
) -> Result<String, String> {
    let client = Client::new();
    let db = init_db().await;

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
        Ok(res) => match res.json::<Permission>().await {
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
                    let permission_id = r.id;
                    edit_job.permission_id = Set(permission_id.clone());
                    edit_job.status = Set(Status::Completed);
                    edit_job.update(db).await.ok();
                    Ok(permission_id)
                } else {
                    return Err(String::from("error getting permission ids"));
                }
            }
        },
    }
}

#[derive(Deserialize, Clone)]
struct Permission {
    id: String,
}

pub async fn copy_file(
    dest_token: &str,
    file_id: &str,
    dest_folder_id: &str,
) -> Result<(), String> {
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
        Ok(_) => Ok(()),
    }
}

pub async fn remove_permission(permission_id: String, file_id: &str, token: &str, job_id: &Uuid) {
    let client = Client::new();
    let db = init_db().await;

    let response = client
        .delete(format!(
            "https://www.googleapis.com/drive/v3/files/{file_id}/permissions/{permission_id}"
        ))
        .bearer_auth(token)
        .send()
        .await;

    match response {
        Ok(_) => (),
        Err(err) => {
            eprintln!("{err:?}");
            let job = JobEntity::find()
                .filter(JobColumn::Id.eq(job_id.to_owned()))
                .one(db)
                .await;
            if let Ok(Some(j)) = job {
                let mut edit_job: JobActive = j.into();
                edit_job.fail_reason = Set(Some(String::from("Error removing permissions")));
                edit_job.update(db).await.ok();
            }
        }
    }
}
