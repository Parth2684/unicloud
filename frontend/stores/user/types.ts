
export enum Quota {
  Free,
  Bronze,
  Silver,
  Gold,
  Platinum
}
export interface UserInfo {
  gmail: string,
  created_at: Date,
  free_quota: Number,
  add_on_quota: Number,
  image: string,
  name: string,
  quota_type: Quota,
  remaining_quota: Number,
  total_quota: Number,
  used_quota: Number
}

export enum TransferType {
  GoogleToGoogle = "google_to_google",
  MegaToGoogle = "mega_to_google"
}

export enum Status {
  Pending= "pending",
  Running = "running",
  Complete = "completed",
  Failed = "failed"
}


export interface Job {
  created_at: Date,
  destination_email: string,
  destination_image?: string,
  fail_reason?: string,
  finished_at?: Date,
  from_drive?: string,
  id: string,
  is_folder: boolean,
  link: string | null,
  link_type: string | null,
  name: string,
  permission_id?: string,
  size: number,
  source_email: string | null,
  source_image: string | null,
  status: Status,
  time: number,
  transfer_type: TransferType
}

export type UserState = {
  userInfo: UserInfo | null;
  jobs: Job[] | null;
}

export type UserAction = {
  setUserInfo: () => Promise<void>
  setJobs: () => Promise<void>
  editJob: (job_id: string, status: Status) => Promise<void>
}