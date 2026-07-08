use chrono::Utc;
use common::db_connect::init_db;
use entities::quota::{Column as QuotaColumn, Entity as QuotaEntity};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, sea_query::Expr};

pub async fn refresh_quota() -> Result<(), String> {
    let db = init_db().await;
    let date = Utc::now().date_naive();

    let refreshed_quota = match QuotaEntity::update_many()
        .col_expr(QuotaColumn::UsedQuota, Expr::value(0))
        .col_expr(
            QuotaColumn::RefreshAt,
            Expr::cust("(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date + 30"),
        )
        .filter(QuotaColumn::RefreshAt.eq(date))
        .exec_with_returning(db)
        .await
    {
        Err(err) => {
            eprintln!(
                "Error running cron jon as data retrieval from db failed: {:?}",
                err
            );
            return Err(err.to_string());
        }
        Ok(quo) => quo,
    };

    println!("quota refreshed: {:?}", refreshed_quota);
    Ok(())
}
