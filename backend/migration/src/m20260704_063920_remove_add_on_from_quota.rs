use sea_orm_migration::{prelude::*, schema::*};

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
                    .add_column_if_not_exists(ColumnDef::new(Quota::AddOnRefresh).date())
                    .to_owned(),
            )
            .await;

        manager
            .create_table(Table::create()
                .table(table)
            )
        
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts

        manager
            .drop_table(Table::drop().table("post").to_owned())
            .await
    }
}


#[derive(DeriveIden)]
enum Quota {
    Table,
    AddOnRefresh
}

#[derive(DeriveIden)]
enum Payment {
    Table,
    Time,
    
}