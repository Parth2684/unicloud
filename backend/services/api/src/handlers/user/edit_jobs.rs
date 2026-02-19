use axum::{
    Extension, Json, extract,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use common::{db_connect::init_db, jwt_config::Claims, redis_connection::init_redis};
use entities::{
    job::{ActiveModel as JobActive, Column as JobColumn, Entity as JobEntity},
    sea_orm_active_enums::Status,
};
use redis::AsyncTypedCommands;
use sea_orm::{ActiveModelTrait, ActiveValue::Set, ColumnTrait, EntityTrait, QueryFilter};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

use crate::utils::app_errors::AppError;

#[derive(Serialize, Deserialize)]
pub struct EditJobBody {
    id: Uuid,
    status: Status,
}

pub async fn edit_job(
    Extension(claims): Extension<Claims>,
    extract::Json(payload): extract::Json<EditJobBody>,
) -> Result<Response, AppError> {
    let (mut redis_conn, db) = tokio::join!(init_redis(), init_db());

    match payload.status {
        Status::Completed | Status::Failed => {
            match JobEntity::find()
                .filter(JobColumn::Id.eq(payload.id))
                .filter(JobColumn::UserId.eq(claims.id))
                .one(db)
                .await
            {
                Err(err) => {
                    eprintln!("error fetching job: {err:?}");
                    Err(AppError::Internal(Some(String::from("Error fetching Job"))))
                }
                Ok(some_job) => match some_job {
                    None => Err(AppError::NotFound(Some(String::from("No such job found")))),
                    Some(job) => {
                        if job.status == payload.status {
                            return Err(AppError::Forbidden(Some(format!(
                                "job status is already {:?}",
                                &payload.status
                            ))));
                        }
                        if job.status == Status::Completed {
                            return Err(AppError::Forbidden(Some(String::from(
                                "You cannot change a job which is completed",
                            ))));
                        }
                        let (_, _) = (
                            redis_conn.lrem("processing", 1, &job.id.to_string()).await,
                            redis_conn.lrem("copy:job", 1, &job.id.to_string()).await,
                        );
                        let mut edit_job: JobActive = job.into();
                        edit_job.status = Set(payload.status);

                        match edit_job.update(db).await {
                            Ok(updated) => Ok((
                                StatusCode::OK,
                                Json(json!({
                                    "message": "job edited successfully",
                                    "job": updated
                                })),
                            )
                                .into_response()),
                            Err(err) => {
                                eprintln!("error updating job: {err:?}");
                                Err(AppError::Internal(Some(String::from("Error editing job"))))
                            }
                        }
                    }
                },
            }
        }
        _ => Err(AppError::Forbidden(Some(String::from(
            "You cannot change a job's status to pending or running",
        )))),
    }
}
