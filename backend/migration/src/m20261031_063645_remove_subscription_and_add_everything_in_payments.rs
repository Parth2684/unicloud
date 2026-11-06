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
            .drop_table(
                Table::drop().table(Payment::Table).to_owned()
            )
            .await
            .unwrap();
        manager
            .drop_table(Table::drop().table(Subscription::Table).to_owned())
            .await?;
        manager
            .drop_type(Type::drop().name(SubStatus::Table).to_owned()
            ).await?;
        manager
            .drop_table(Table::drop().table(Plans::Table).to_owned())
            .await?;

        manager
            .create_type(Type::create()
                .as_enum(OrderStatus::Type)
                .values([OrderStatus::Pending, OrderStatus::Success, OrderStatus::Failed])
                .to_owned()
            ).await?;
        manager
            .create_table(
                Table::create()
                    .table(Order::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Order::OrderId).string().primary_key())
                    .col(ColumnDef::new(Order::Amount).big_integer().not_null())
                    .col(ColumnDef::new(Order::CreatedAt).timestamp_with_time_zone().not_null().default(Expr::current_timestamp()))
                    .col(ColumnDef::new(Order::Currency).string_len(3).not_null())
                    .col(ColumnDef::new(Order::OrderStatus).enumeration(OrderStatus::Type, [OrderStatus::Failed, OrderStatus::Pending, OrderStatus::Success]).not_null())
                    .col(ColumnDef::new(Order::PaymentId).string())
                    .col(ColumnDef::new(Order::UserId).uuid().not_null())
                    .col(ColumnDef::new(Order::UpdatedAt).date_time().not_null().default(Expr::cust("NOW()")))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-order-user-id")
                            .from(Order::Table, Order::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::NoAction)
                    )
                    .to_owned()
            ).await?;
            Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {

        manager
            .drop_table(
                Table::drop()
                    .table(Order::Table)
                    .if_exists()
                    .to_owned()
                )
            .await?;

        manager
            .drop_type(
                Type::drop()
                    .name(OrderStatus::Type)
                    .if_exists()
                    .to_owned()
                ).await?;
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


        manager
            .create_table(
                Table::create()
                    .table(Payment::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Payment::RazorpayPaymentId)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(Payment::Amount)
                            .big_integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Payment::Currency)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Payment::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Payment::RazorpayOrderId)
                            .text(),
                    )
                    .col(
                        ColumnDef::new(Payment::PaymentStatus)
                            .enumeration(
                                PaymentStatus::Table,
                                [
                                    PaymentStatus::Created,
                                    PaymentStatus::Authorized,
                                    PaymentStatus::Captured,
                                    PaymentStatus::Refunded,
                                    PaymentStatus::Failed,
                                ],
                            )
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Payment::SubscriptionId)
                            .string(),
                    )
                    .col(
                        ColumnDef::new(Payment::UserId)
                            .uuid()
                            .not_null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_payment_subscription_id")
                            .from(Payment::Table, Payment::SubscriptionId)
                            .to(
                                Subscription::Table,
                                Subscription::RazorpaySubscriptionId,
                            )
                            .on_update(ForeignKeyAction::NoAction)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_payment_user_id")
                            .from(Payment::Table, Payment::UserId)
                            .to(Users::Table, Users::Id)
                            .on_update(ForeignKeyAction::NoAction)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
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

#[allow(clippy::enum_variant_names)]
#[derive(DeriveIden)]
enum Payment {
    Table,
    RazorpayPaymentId,
    Amount,
    Currency,
    CreatedAt,
    RazorpayOrderId,
    PaymentStatus,
    SubscriptionId,
    UserId,
}

#[derive(DeriveIden)]
enum PaymentStatus {
    Table,
    Created,
    Authorized,
    Captured,
    Refunded,
    Failed,
}

#[allow(clippy::enum_variant_names)]
#[derive(DeriveIden)]
enum Order {
    Table,
    OrderId,
    PaymentId,
    Amount,
    Currency,
    CreatedAt,
    OrderStatus,
    UserId,
    UpdatedAt
}

#[derive(DeriveIden)]
enum OrderStatus {
    Type,
    Pending,
    Success,
    Failed
}
