use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {

        manager
            .alter_table(
                Table::alter()
                    .table(Job::Table)
                    .add_column_if_not_exists(ColumnDef::new(Job::Claims).string().not_null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts

        manager
            .alter_table(
                Table::alter()
                    .table(Job::Table)
                    .drop_column_if_exists(Job::Claims)
                    .to_owned()
            )
            .await
    }
}


#[derive(DeriveIden)]
enum Job {
    Table,
    Claims
}