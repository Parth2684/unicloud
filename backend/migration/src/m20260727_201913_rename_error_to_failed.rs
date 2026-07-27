use sea_orm_migration::{prelude::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260727_201913_rename_error_to_failed"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("ALTER TYPE payment_status RENAME VALUE 'error' TO 'failed';")
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("ALTER TYPE payment_status RENAME VALUE 'failed' TO 'error';")
            .await?;
        Ok(())
    }
}
