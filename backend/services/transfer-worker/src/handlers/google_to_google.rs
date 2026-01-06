
use common::{db_connect::init_db, encrypt::decrypt, redis_connection::init_redis};
use entities::{
    cloud_account::{
        ActiveModel as CloudAccountActive, Column as CloudAccountColumn,
        Entity as CloudAccountEntity,
    },
    job::{ActiveModel as JobActive, Column as JobColumn, Entity as JobEntity, Model as JobModel},
    quota::{Column as QuotaColumn, Entity as QuotaEntity, ActiveModel as QuotaActive },
    sea_orm_active_enums::Status,
};
use redis::AsyncTypedCommands;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set,
};

use crate::helpers::{
    fetch_permission_google::fetch_permissions,
    share_google::{copy_file, create_permission, remove_permission},
};

pub async fn copy_google_to_google(job: JobModel) {
    let (db, mut redis_conn) = tokio::join!(init_db(), init_redis());

    if let (Some(from_drive), Some(from_file_id), Some(is_folder)) =
        (&job.from_drive, &job.from_file_id, &job.is_folder)
    {
        if !is_folder {
            match job.size {
                None => {
                    let job_edit = JobEntity::find()
                        .filter(JobColumn::Id.eq(job.id.clone()))
                        .one(db)
                        .await;

                    if let Ok(Some(model)) = job_edit {
                        let mut edit: JobActive = model.into();
                        edit.status = Set(Status::Failed);
                        edit.update(db).await.ok();
                    }

                    redis_conn
                        .lrem("processing", 1, job.id.to_string())
                        .await
                        .ok();
                }
                Some(size) => {
                    let all_jobs = JobEntity::find()
                        .filter(JobColumn::UserId.eq(job.user_id.clone()))
                        .all(db)
                        .await;

                    if let Ok(jobs) = all_jobs {
                        for j in jobs {
                            if j.status == Status::Running {
                                let (remove_processing, add_copy) = (
                                    redis_conn.lrem("processing", 1, job.id.to_string()).await,
                                    redis_conn.lpush("copy:job", job.id.to_string()).await,
                                );
                                if let (Ok(_), Ok(_)) = (remove_processing, add_copy) {
                                    return;
                                } else {
                                    let mut edit_job: JobActive = job.into();
                                    edit_job.status = Set(Status::Failed);
                                    edit_job.update(db).await.ok();
                                    return;
                                }
                            }
                        }
                        let quota = QuotaEntity::find()
                            .filter(QuotaColumn::UserId.eq(job.user_id.clone()))
                            .one(db)
                            .await;
                        match quota {
                            Err(_err) => {
                                let (remove_processing, add_copy) = (
                                    redis_conn.lrem("processing", 1, job.id.to_string()).await,
                                    redis_conn.lpush("copy:job", job.id.to_string()).await,
                                );
                                if let (Ok(_), Ok(_)) = (remove_processing, add_copy) {
                                    return;
                                } else {
                                    let mut edit_job: JobActive = job.into();
                                    edit_job.status = Set(Status::Failed);
                                    edit_job.update(db).await.ok();
                                    return;
                                }
                            }
                            Ok(optional_quota) => match optional_quota {
                                None => {
                                    match redis_conn.lrem("processing", 1, job.id.to_string()).await
                                    {
                                        Ok(_) => return,
                                        Err(err) => {
                                            eprintln!("error rempving from processing: {err:?}");
                                            let mut edit_job: JobActive = job.into();
                                            edit_job.status = Set(Status::Failed);
                                            edit_job.fail_reason = Set(Some(String::from("Error Getting quota")));
                                            edit_job.update(db).await.ok();
                                            return;
                                        }
                                    }
                                }
                                Some(quo) => {
                                    if quo.remaining_quota > size {
                                        let mut edit_job: JobActive = job.clone().into();
                                        edit_job.status = Set(Status::Running);
                                        match edit_job.update(db).await {
                                            Err(err) => {
                                                eprintln!("Error connecting to db: {err:?}");
                                                let (_, _) = (
                                                    redis_conn
                                                        .lrem("processing", 1, job.id.to_string())
                                                        .await,
                                                    redis_conn
                                                        .lpush("copy:job", job.id.to_string())
                                                        .await,
                                                );
                                                return;
                                            }
                                            Ok(_) => {
                                                let cloud_acc = CloudAccountEntity::find()
                                                    .filter(
                                                        CloudAccountColumn::Id
                                                            .eq(from_drive.clone()),
                                                    )
                                                    .one(db)
                                                    .await;
                                                if let Ok(Some(acc)) = cloud_acc {
                                                    match decrypt(&acc.access_token) {
                                                        Err(err) => {
                                                            eprintln!(
                                                                "error decrypting token: {:?}",
                                                                err
                                                            );
                                                            redis_conn
                                                                .lrem(
                                                                    "processing",
                                                                    1,
                                                                    job.id.to_string(),
                                                                )
                                                                .await
                                                                .ok();
                                                            let mut edit_job: JobActive =
                                                                job.clone().into();
                                                            edit_job.status = Set(Status::Failed);
                                                            edit_job.fail_reason = Set(Some(
                                                                String::from(
                                                                    "Error Decrypting your access token from source account please try refreshing your account",
                                                                ),
                                                            ));
                                                            edit_job.update(db).await.ok();
                                                            let mut edit_cloud: CloudAccountActive =
                                                                acc.into();
                                                            edit_cloud.token_expired = Set(true);
                                                            edit_cloud.update(db).await.ok();
                                                        }
                                                        Ok(token) => {
                                                            match fetch_permissions(
                                                                from_file_id,
                                                                &token,
                                                            )
                                                            .await
                                                            {
                                                                Err(err) => {
                                                                    eprintln!(
                                                                        "error fetching permission: {err:?}"
                                                                    );
                                                                    let mut edit_job: JobActive =
                                                                        job.clone().into();
                                                                    edit_job.fail_reason =
                                                                        Set(Some(err));
                                                                    edit_job.update(db).await.ok();
                                                                    redis_conn
                                                                        .lrem(
                                                                            "processing",
                                                                            1,
                                                                            job.id.to_string(),
                                                                        )
                                                                        .await
                                                                        .ok();
                                                                }
                                                                Ok(_) => {
                                                                    let destination_acc = CloudAccountEntity::find()
                                                                        .filter(CloudAccountColumn::Id.eq(job.to_drive))
                                                                        .one(db)
                                                                        .await;
                                                                    if let Ok(Some(dest_acc)) =
                                                                        destination_acc
                                                                    {
                                                                        match create_permission(
                                                                            &token,
                                                                            &from_file_id,
                                                                            &dest_acc.email,
                                                                        )
                                                                        .await
                                                                        {
                                                                            Err(err) => {
                                                                                eprintln!(
                                                                                    "{err:?}"
                                                                                );
                                                                                let mut edit_job: JobActive = job.clone().into();
                                                                                edit_job
                                                                                    .fail_reason =
                                                                                    Set(Some(err));
                                                                                edit_job.status = Set(Status::Failed);
                                                                                edit_job
                                                                                    .update(db)
                                                                                    .await
                                                                                    .ok();
                                                                                redis_conn.lrem("processing", 1, job.id.to_string()).await.ok();
                                                                            }
                                                                            Ok(_) => (),
                                                                        };
                                                                        match decrypt(
                                                                            &dest_acc.access_token,
                                                                        ) {
                                                                            Err(err) => {
                                                                                eprintln!(
                                                                                    "error decrypting token: {:?}",
                                                                                    err
                                                                                );
                                                                                redis_conn
                                                                                    .lrem(
                                                                                        "processing",
                                                                                        1,
                                                                                        job.id.to_string(),
                                                                                    )
                                                                                    .await
                                                                                    .ok();
                                                                                let mut edit_job: JobActive =
                                                                                    job.clone().into();
                                                                                edit_job.status = Set(Status::Failed);
                                                                                edit_job.fail_reason = Set(Some(String::from("Error Decrypting your access token from destination account please try refreshing your account")));
                                                                                edit_job
                                                                                    .update(db)
                                                                                    .await
                                                                                    .ok();
                                                                                let mut edit_cloud: CloudAccountActive =
                                                                                    dest_acc.into();
                                                                                edit_cloud.token_expired = Set(true);
                                                                                edit_cloud
                                                                                    .update(db)
                                                                                    .await
                                                                                    .ok();
                                                                            }
                                                                            Ok(dest_token) => {
                                                                                match copy_file(&dest_token, from_file_id, &job.to_folder_id, &job.id).await {
                                                                                    Err(err) => {
                                                                                        let mut edit_job: JobActive = job.clone().into();
                                                                                        edit_job.status = Set(Status::Failed);
                                                                                        edit_job.fail_reason = Set(Some(err));
                                                                                        edit_job.update(db).await.ok();
                                                                                        redis_conn.lrem("processing", 1, job.id.to_string()).await.ok();
                                                                                        
                                                                                    }
                                                                                    Ok(ids) => {
                                                                                        remove_permission(ids, from_file_id, &token, &job.id).await;
                                                                                        redis_conn.lrem("processing", 1, job.id.to_string()).await.ok();
                                                                                        let remaining_add_on = &quo.add_on_quota;
                                                                                        if remaining_add_on >= &size {
                                                                                            let mut edit_quota: QuotaActive = quo.clone().into();
                                                                                            edit_quota.add_on_quota = Set(remaining_add_on - size);
                                                                                            edit_quota.update(db).await.ok();
                                                                                        }else {
                                                                                            let edit_free_quota = &size - remaining_add_on;
                                                                                            let mut edit_quota: QuotaActive = quo.clone().into();
                                                                                            edit_quota.add_on_quota = Set(0);
                                                                                            edit_quota.free_quota = Set(edit_free_quota);
                                                                                            edit_quota.update(db).await.ok();
                                                                                        }
                                                                                        
                                                                                    }
                                                                                };
                                                                            }
                                                                        };
                                                                    }
                                                                }
                                                            };
                                                        }
                                                    }
                                                } else {
                                                    let mut edit_job: JobActive =
                                                        job.clone().into();
                                                    edit_job.status = Set(Status::Failed);
                                                    edit_job.fail_reason = Set(Some(String::from(
                                                        "Error retrieving source account",
                                                    )));
                                                    edit_job.update(db).await.ok();
                                                    let (_, _) = (
                                                        redis_conn
                                                            .lrem(
                                                                "processing",
                                                                1,
                                                                job.id.to_string(),
                                                            )
                                                            .await,
                                                        redis_conn
                                                            .lpush("copy:job", job.id.to_string())
                                                            .await,
                                                    );
                                                }
                                            }
                                        };
                                    }
                                }
                            },
                        }
                    }
                }
            }
        }
    }
}
