use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts

        manager
            .alter_table(
                Table::alter()
                    .table(Quota::Table)
                    .add_column_if_not_exists(
                        ColumnDef::new(Quota::RefreshAt)
                            .date()
                            .not_null()
                            .default(Expr::cust("CURRENT_TIMESTAMP + INTERVAL '30 day'")),
                    )
                    .add_column_if_not_exists(ColumnDef::new(Quota::TotalUsed).big_integer().not_null().default(0))
                    .drop_column_if_exists(Quota::RemainingQuota)
                    .drop_column_if_exists(Quota::TotalQuota)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Quota::Table)
                    .drop_column_if_exists(Quota::RefreshAt)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Quota {
    Table,
    RefreshAt,
    TotalQuota,
    RemainingQuota,
    TotalUsed
}
