use sea_orm_migration::{prelude::*, sea_query::extension::postgres::Type};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261031_063645_remove_subscription_and_add_everything_in_payments"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Payment::Table)
                    .modify_column(ColumnDef::new(Payment::RazorpayOrderId).not_null())
                    .drop_column_if_exists(Payment::SubscriptionId)
                    .to_owned(),
            )
            .await
            .unwrap();
        manager
            .drop_table(Table::drop().table(Subscription::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Plans::Table).to_owned())
            .await
        
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Recreate plans table
        manager
            .create_table(
                Table::create()
                    .table(Plans::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Plans::Id).string().not_null().primary_key())
                    .col(ColumnDef::new(Plans::Name).string().not_null().unique_key())
                    .col(ColumnDef::new(Plans::Description).string().not_null())
                    .col(ColumnDef::new(Plans::Amount).big_integer().not_null())
                    .col(
                        ColumnDef::new(Plans::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Plans::Interval).integer().not_null())
                    .col(ColumnDef::new(Plans::Period).string().not_null())
                    .col(ColumnDef::new(Plans::Currency).string().not_null())
                    .to_owned(),
            )
            .await?;

        // Recreate the subscription status enum.
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

        // Recreate subscription table
        manager
            .create_table(
                Table::create()
                    .table(Subscription::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Subscription::RazorpaySubscriptionId)
                            .text()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(Subscription::CurrentPeriodStart)
                            .date()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Subscription::CurrentPeriodEnd)
                            .date()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Subscription::UserId).uuid().not_null())
                    .col(ColumnDef::new(Subscription::PlanId).string())
                    .col(
                        ColumnDef::new(Subscription::Status)
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
                            .default("pending"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_subscription_plan_id")
                            .from(Subscription::Table, Subscription::PlanId)
                            .to(Plans::Table, Plans::Id)
                            .on_delete(ForeignKeyAction::NoAction)
                            .on_update(ForeignKeyAction::NoAction),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_subscription_user_id")
                            .from(Subscription::Table, Subscription::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::NoAction)
                            .on_update(ForeignKeyAction::NoAction),
                    )
                    .to_owned(),
            )
            .await?;

        // Restore the payment columns changed by up().
        manager
            .alter_table(
                Table::alter()
                    .table(Payment::Table)
                    .modify_column(ColumnDef::new(Payment::RazorpayOrderId).string())
                    .add_column(ColumnDef::new(Payment::SubscriptionId).text())
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Plans {
    Table,
    Id,
    Name,
    Description,
    Amount,
    CreatedAt,
    Interval,
    Period,
    Currency,
}

#[derive(DeriveIden)]
enum Subscription {
    Table,
    RazorpaySubscriptionId,
    CurrentPeriodStart,
    CurrentPeriodEnd,
    UserId,
    PlanId,
    Status,
}

#[derive(DeriveIden)]
enum SubStatus {
    Table,
    Active,
    Cancelled,
    Expired,
    Pending,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Payment {
    Table,
    RazorpayOrderId,
    SubscriptionId,
}
