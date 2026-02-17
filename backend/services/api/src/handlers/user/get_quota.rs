use axum::{
    Extension, Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use common::{db_connect::init_db, jwt_config::Claims};
use entities::{
    quota::Column as QuotaColumn,
    users::{Column as UserColumn, Entity as UserEntity, Relation as UserRelation},
};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, QuerySelect, RelationTrait};
use serde_json::json;

use crate::utils::app_errors::AppError;

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
        .column(QuotaColumn::RemainingQuota)
        .column(QuotaColumn::TotalQuota)
        .column(QuotaColumn::UsedQuota)
        .into_json()
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
