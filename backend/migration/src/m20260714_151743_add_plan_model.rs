use sea_orm_migration::{prelude::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {

        manager
            .create_table(
                Table::create()
                    .table(Plans::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Plans::Id).string().primary_key())
                    .col(ColumnDef::new(Plans::Name).string().not_null().unique_key())
                    .col(ColumnDef::new(Plans::Description).string().not_null())
                    .col(ColumnDef::new(Plans::Amount).big_integer().not_null().check(Expr::col(Plans::Amount).gt(0)))
                    .col(ColumnDef::new(Plans::CreatedAt).timestamp_with_time_zone().not_null())
                    .col(ColumnDef::new(Plans::Interval).integer().not_null())
                    .col(ColumnDef::new(Plans::Period).string().not_null())
                    .col(ColumnDef::new(Plans::Currency).char_len(3).not_null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {

        manager
            .drop_table(Table::drop().table(Plans::Table).to_owned())
            .await
    }
}



#[derive(DeriveIden)]
enum Plans {
    Table,
    Id,
    Name,
    Description,
    Interval,
    Period,
    Amount,
    Currency,
    CreatedAt
}
