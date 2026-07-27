use sea_orm_migration::{prelude::*, sea_query::extension::postgres::Type};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {

        manager
            .create_type(
                Type::create()
                    .as_enum(Status::Table)
                    .values([Status::Active, Status::Cancelled, Status::Expired, Status::Pending])
                    .to_owned()
            ).await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Subscription::Table)
                    .add_column_if_not_exists(ColumnDef::new(Subscription::Table)
                        .enumeration(Status::Table, [Status::Active, Status::Cancelled, Status::Expired, Status::Pending])
                        .not_null()
                        .default(Expr::cust("'pending'"))
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
      

        manager
            .drop_type(Type::drop().if_exists().name(Status::Table).to_owned())
            .await?;

        manager
            .alter_table(Table::alter()
                .table(Subscription::Table)
                .drop_column_if_exists(Subscription::Status).to_owned()
            ).await
            
    }
}


#[derive(DeriveIden)]
enum Subscription {
    Table,
    Status
}

#[derive(DeriveIden)]
enum Status {
    Table,
    Active,
    Cancelled,
    Expired,
    Pending
}