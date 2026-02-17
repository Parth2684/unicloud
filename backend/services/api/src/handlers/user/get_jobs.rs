use axum::{
    Extension, Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use common::{db_connect::init_db, jwt_config::Claims};
use entities::{
    cloud_account::{Column as CloudColumn},
    job::{Column as JobColumn, Entity as JobEntity, Relation as JobRelation},
};
use sea_orm::{
    ColumnTrait, EntityTrait, QueryFilter,
    QuerySelect, RelationTrait, prelude::Expr, sea_query::Alias,
};
use serde_json::json;

use crate::utils::app_errors::AppError;

pub async fn get_jobs(Extension(claims): Extension<Claims>) -> Result<Response, AppError> {
    let db = init_db().await;

    let jobs = JobEntity::find()
        .filter(JobColumn::UserId.eq(claims.id))
        .join_as(
            sea_orm::JoinType::LeftJoin,
            JobRelation::CloudAccount1.def(),
            Alias::new("source_account"),
        )
        .join_as(
            sea_orm::JoinType::LeftJoin,
            JobRelation::CloudAccount2.def(),
            Alias::new("destination_account"),
        )
        .select_only()
        .column(JobColumn::Id)
        .column(JobColumn::CreatedAt)
        .column(JobColumn::Status)
        .column(JobColumn::TransferType)
        .column(JobColumn::Size)
        .column(JobColumn::IsFolder)
        .column(JobColumn::Link)
        .column(JobColumn::LinkType)
        .column(JobColumn::PermissionId)
        .column(JobColumn::FailReason)
        .column(JobColumn::FromDrive)
        .column(JobColumn::Time)
        .column(JobColumn::FinishedAt)
        .column_as(
            Expr::col((Alias::new("source_account"), CloudColumn::Provider)),
            "source_provider",
        )
        .column_as(
            Expr::col((Alias::new("source_account"), CloudColumn::Email)),
            "source_email",
        )
        .column_as(
            Expr::col((Alias::new("source_account"), CloudColumn::Image)),
            "source_image",
        )
        .column_as(
            Expr::col((Alias::new("destination_account"), CloudColumn::Provider)),
            "destination_provider",
        )
        .column_as(
            Expr::col((Alias::new("destination_account"), CloudColumn::Email)),
            "destination_email",
        )
        .column_as(
            Expr::col((Alias::new("destination_account"), CloudColumn::Image)),
            "destination_image",
        )
        .into_json()
        .all(db)
        .await;

    match jobs {
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
