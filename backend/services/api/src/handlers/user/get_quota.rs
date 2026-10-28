use axum::{
    Extension, Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use chrono::{NaiveDateTime};
use common::{db_connect::init_db, jwt_config::Claims};
use entities::{
    quota::Column as QuotaColumn,
    sea_orm_active_enums::QuotaType,
    users::{Column as UserColumn, Entity as UserEntity, Relation as UserRelation},
};
use sea_orm::{
    ColumnTrait, EntityTrait, ExprTrait, FromQueryResult, QueryFilter, QuerySelect, RelationTrait,
    sea_query::Expr,
};
use serde::Serialize;
use serde_json::json;

use crate::utils::app_errors::AppError;

#[derive(Debug, Serialize, FromQueryResult)]
pub struct UserInfo {
    pub gmail: String,
    pub created_at: NaiveDateTime,
    pub free_quota: i64,
    pub add_on_quota: i64,
    pub image: String,
    pub quota_type: QuotaType,
    pub remaining_quota: i64,
    pub total_used: i64,
    pub used_quota: i64,
}


pub async fn get_user_info(Extension(claims): Extension<Claims>) -> Result<Response, AppError> {
    let db = init_db().await;
    let info = UserEntity::find()
        .filter(UserColumn::Id.eq(claims.id))
        .join(sea_orm::JoinType::LeftJoin, UserRelation::Quota.def())
        .select_only()
        .column(UserColumn::CreatedAt)
        .column(UserColumn::Gmail)
        .column(UserColumn::Image)
        .column(UserColumn::Name)
        .column(QuotaColumn::AddOnQuota)
        .column(QuotaColumn::FreeQuota)
        .column(QuotaColumn::QuotaType)
        .column(QuotaColumn::UsedQuota)
        .column(QuotaColumn::TotalUsed)
        .column_as(
            Expr::col(QuotaColumn::FreeQuota)
                .add(Expr::col(QuotaColumn::AddOnQuota))
                .sub(Expr::col(QuotaColumn::UsedQuota)),
            "remaining_quota",
        )
        .into_model::<UserInfo>()
        .one(db)
        .await;

    if let Ok(Some(user_info)) = info {
        Ok((
            StatusCode::OK,
            Json(json!({
                "user_info": user_info,
            })),
        )
            .into_response())
    } else {
        Err(AppError::Internal(Some(String::from(
            "Error finding your info",
        ))))
    }
}
