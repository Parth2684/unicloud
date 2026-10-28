import { axiosInstance } from "@/utils/axiosInstance";
import type { Job, Status, UserInfo } from "@/stores/user/types";

export async function fetchUserInfo(): Promise<UserInfo> {
  const res = await axiosInstance.get("/user/get-user-info");
  return res.data.user_info;
}

export async function fetchJobs(): Promise<Job[]> {
  const res = await axiosInstance.get("/user/get-jobs");
  return res.data.jobs;
}

export async function editJobStatus(id: string, status: Status): Promise<Job> {
  const res = await axiosInstance.post("/user/edit-job", {
    id,
    status: status.charAt(0).toUpperCase() + status.slice(1),
  });
  return res.data.job;
}
