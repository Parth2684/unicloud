use sea_orm_migration::{prelude::*, sea_query::extension::postgres::Type};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts
        manager
            .create_type(
                Type::create()
                    .as_enum(PaymentStatus::Table)
                    .values([
                        PaymentStatus::Error,
                        PaymentStatus::Pending,
                        PaymentStatus::Authorized,
                        PaymentStatus::Cancelled,
                        PaymentStatus::Captured,
                        PaymentStatus::Refunded,
                    ])
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Subscription::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Subscription::Id)
                            .uuid()
                            .primary_key()
                            .unique_key()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Subscription::RazorpaySubscriptionId)
                            .text()
                            .unique_key()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Subscription::CurrentPeriodStart)
                            .date()
                            .not_null()
                            .default(Expr::cust("(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date")),
                    )
                    .col(
                        ColumnDef::new(Subscription::CurrentPeriodEnd)
                            .date()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Subscription::UserId).uuid().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-subscription-user-id")
                            .from(Subscription::Table, Subscription::UserId)
                            .to(Users::Table, Users::Id),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Payment::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Payment::Id)
                            .uuid()
                            .primary_key()
                            .not_null()
                            .unique_key(),
                    )
                    .col(ColumnDef::new(Payment::Amount).big_integer().not_null())
                    .check(Expr::col(Payment::Amount).gte(0))
                    .col(ColumnDef::new(Payment::Currency).char_len(3).not_null())
                    .col(
                        ColumnDef::new(Payment::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::cust("CURRENT_TIMESTAMP")),
                    )
                    .col(
                        ColumnDef::new(Payment::RazorpayPaymentId)
                            .text()
                            .not_null()
                            .unique_key(),
                    )
                    .col(ColumnDef::new(Payment::RazorpayOrderId).text())
                    .col(
                        ColumnDef::new(Payment::PaymentStatus)
                            .enumeration(
                                PaymentStatus::Table,
                                [
                                    PaymentStatus::Error,
                                    PaymentStatus::Pending,
                                    PaymentStatus::Authorized,
                                    PaymentStatus::Cancelled,
                                    PaymentStatus::Captured,
                                    PaymentStatus::Refunded,
                                ],
                            )
                            .not_null()
                            .default(Expr::cust("'pending'")),
                    )
                    .col(ColumnDef::new(Payment::SubscriptionId).uuid())
                    .col(ColumnDef::new(Payment::UserId).uuid().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-payment-subscription-id")
                            .from(Payment::Table, Payment::SubscriptionId)
                            .to(Subscription::Table, Subscription::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-payment-user-id")
                            .from(Payment::Table, Payment::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts

        manager
            .drop_table(Table::drop().table(Payment::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Subscription::Table).to_owned())
            .await?;
        manager
            .drop_type(
                Type::drop()
                    .if_exists()
                    .name(PaymentStatus::Table)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Subscription {
    Table,
    Id,
    UserId,
    RazorpaySubscriptionId,
    CurrentPeriodStart,
    CurrentPeriodEnd,
}

#[derive(DeriveIden)]
enum Payment {
    Table,
    Id,
    RazorpayPaymentId,
    RazorpayOrderId,
    Amount,
    Currency,
    PaymentStatus,
    CreatedAt,
    SubscriptionId,
    UserId,
}

#[derive(DeriveIden)]
enum PaymentStatus {
    Table,
    Pending,
    Authorized,
    Captured,
    Refunded,
    Cancelled,
    Error,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
