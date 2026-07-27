use sea_orm_migration::{prelude::*, sea_query::extension::postgres::Type};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_type(
                Type::create()
                    .as_enum(SubStatus::Table)
                    .values([
                        SubStatus::Active,
                        SubStatus::Cancelled,
                        SubStatus::Expired,
                        SubStatus::Pending,
                    ])
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Subscription::Table)
                    .add_column_if_not_exists(
                        ColumnDef::new(Subscription::Table)
                            .enumeration(
                                SubStatus::Table,
                                [
                                    SubStatus::Active,
                                    SubStatus::Cancelled,
                                    SubStatus::Expired,
                                    SubStatus::Pending,
                                ],
                            )
                            .not_null()
                            .default(Expr::cust("'pending'")),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_type(Type::drop().if_exists().name(SubStatus::Table).to_owned())
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Subscription::Table)
                    .drop_column_if_exists(Subscription::SubStatus)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Subscription {
    Table,
    SubStatus,
}

#[derive(DeriveIden)]
enum SubStatus {
    Table,
    Active,
    Cancelled,
    Expired,
    Pending,
}
