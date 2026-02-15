use axum::{
    Extension, Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use common::{db_connect::init_db, jwt_config::Claims};
use entities::{
    cloud_account::{Column as CloudColumn, Entity as CloudAccountEntity},
    job::{self, Column as JobColumn, Entity as JobEntity},
};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, QuerySelect, RelationTrait};
use serde_json::json;

use crate::utils::app_errors::AppError;

pub async fn get_jobs(Extension(claims): Extension<Claims>) -> Result<Response, AppError> {
    let db = init_db().await;
    match JobEntity::find()
        .filter(JobColumn::UserId.eq(claims.id))
        .join(
            sea_orm::JoinType::LeftJoin,
            job::Relation::CloudAccount1.def(),
        )
        .join(
            sea_orm::JoinType::LeftJoin,
            job::Relation::CloudAccount2.def(),
        )
        .all(db)
        .await
    {
        Err(err) => {
            eprintln!("error fetching jobs: {:?}", err);
            return Err(AppError::Internal(Some(String::from(
                "Error fetching jobs",
            ))));
        }
        Ok(jobs) => Ok((
            (StatusCode::OK),
            (Json(json!({
                "message": "Jobs fetched successful",
                "jobs": jobs
            }))),
        )
            .into_response()),
    }
}
