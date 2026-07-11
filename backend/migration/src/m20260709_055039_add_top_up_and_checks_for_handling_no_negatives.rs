use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // let ten_gb: i64 = 10737418240;
        manager
            .alter_table(
                Table::alter()
                    .table(Quota::Table)
                    .add_column_if_not_exists(
                        ColumnDef::new(Quota::TopUp)
                            .big_integer()
                            .not_null()
                            .default(0)
                            .check(Expr::col(Quota::TopUp).gte(0)),
                    )
                    .to_owned(),
            )
            .await?;

        let db = manager.get_connection();
        let backend = manager.get_database_backend();

        db.execute_raw(sea_orm::Statement::from_string(
            backend,
            "ALTER TABLE quota ADD CONSTRAINT check_top_up CHECK (top_up >= 0);".to_owned(),
        ))
        .await?;

        db.execute_raw(sea_orm::Statement::from_string(
            backend,
            "ALTER TABLE quota ADD CONSTRAINT check_free_quota CHECK (free_quota >= 0);".to_owned(),
        ))
        .await?;

        db.execute_raw(sea_orm::Statement::from_string(
            backend,
            "ALTER TABLE quota ADD CONSTRAINT check_add_on_quota CHECK (add_on_quota >= 0);"
                .to_owned(),
        ))
        .await?;

        db.execute_raw(sea_orm::Statement::from_string(
            backend,
            "ALTER TABLE quota ADD CONSTRAINT check_used_quota CHECK (used_quota >= 0);".to_owned(),
        ))
        .await?;

        db.execute_raw(sea_orm::Statement::from_string(
            backend,
            "ALTER TABLE quota ADD CONSTRAINT check_total_used CHECK (total_used >= 0);".to_owned(),
        ))
        .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts

        manager
            .alter_table(
                Table::alter()
                    .table(Quota::Table)
                    .drop_column_if_exists(Quota::TopUp)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Quota {
    Table,
    TopUp,
    // FreeQuota,
    // AddOnQuota,
    // UsedQuota,
    // TotalUsed,
}
