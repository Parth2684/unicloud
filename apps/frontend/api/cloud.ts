import { axiosInstance } from "@/utils/axiosInstance";
import type {
  DriveFile,
  ErrorCloudAccount,
  SharedDrive,
  SuccessCloudAccount,
} from "@/stores/cloud/types";
import type { Job } from "@/stores/user/types";

export async function fetchCloudAccounts(): Promise<{
  google_drive_accounts: SuccessCloudAccount[];
  need_refresh: ErrorCloudAccount[];
}> {
  const res = await axiosInstance.get("/cloud/get-cloud-accounts");
  return res.data;
}

export async function fetchDriveRoot(driveId: string): Promise<DriveFile[]> {
  const res = await axiosInstance.get(`/cloud/google/root/${driveId}`);
  return res.data.files;
}

export async function fetchDriveFolder(driveId: string, folderId: string): Promise<DriveFile[]> {
  const res = await axiosInstance.get(`/cloud/google/folder/${driveId}/${folderId}`);
  return res.data.files;
}

export async function fetchFolderChildren(
  driveId: string,
  folderId?: string,
): Promise<DriveFile[]> {
  return folderId ? fetchDriveFolder(driveId, folderId) : fetchDriveRoot(driveId);
}

export async function fetchSharedDrives(driveId: string): Promise<SharedDrive[]> {
  const res = await axiosInstance.get(`/cloud/google/shared_drive/${driveId}`);
  return res.data.drives;
}

export async function copyFile(payload: {
  from_drive: string;
  from_file_id: string;
  to_drive: string;
  to_folder_id: string;
}): Promise<{ message: string; job: Job }> {
  const res = await axiosInstance.post("/cloud/google/google-copy", payload);
  return res.data;
}

export async function deleteDriveAccount(driveId: string): Promise<void> {
  await axiosInstance.delete(`/cloud/google/delete-drive/${driveId}`);
}

export async function deleteDriveFile(driveId: string, fileId: string): Promise<void> {
  await axiosInstance.delete(`/cloud/google/delete-file/${driveId}/${fileId}`);
}
