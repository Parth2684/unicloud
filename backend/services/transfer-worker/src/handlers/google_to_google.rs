use std::sync::{Arc, Mutex};

use common::{db_connect::init_db, redis_connection::init_redis};
use entities::{
    job::{ActiveModel as JobActive, Column as JobColumn, Entity as JobEntity, Model as JobModel},
    quota::{Column as QuotaColumn, Entity as QuotaEntity},
    sea_orm_active_enums::Status,
};
use redis::AsyncTypedCommands;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};

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
                            Err(err) => {
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
                                            edit_job.update(db).await.ok();
                                            return;
                                        }
                                    }
                                }
                                Some(quo) => {
                                    if quo.add_on_quota > size {
                                        todo!();
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
