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

export type SearchMimeType = "audio/" | "application/vnd.google-apps.folder" | "video/" | "image/" | "application/pdf";
export type SearchOrderBy = "modifiedTime" | "modifiedTime desc" | "quotaBytesUsed" | "quotaBytesUsed desc" | "starred";
export type CloudSearchResult = { files: DriveFile[]; nextPageToken?: string };
export async function searchCloudFiles(query: string, cloudAccounts: Record<string, string | null>, mimeType: SearchMimeType[], options: { orderBy?: SearchOrderBy; parentFolderId?: string } = {}): Promise<{ search_results: [CloudSearchResult, string][] }> {
  const params = new URLSearchParams();
  if (options.orderBy) params.set("order_by", options.orderBy);
  if (options.parentFolderId) params.set("parent_folder_id", options.parentFolderId);
  const suffix = params.size ? `?${params.toString()}` : "";
  const res = await axiosInstance.post(`/cloud/google/search/${encodeURIComponent(query)}${suffix}`, { cloud_accounts: cloudAccounts, mime_type: mimeType });
  return res.data;
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

export async function createDriveFolder(payload: {
  drive_id: string;
  parent_id: string;
  folder_name: string;
}): Promise<{ folder: DriveFile }> {
  const res = await axiosInstance.post("/cloud/google/create-folder", payload);
  return res.data;
}

export async function deleteDriveAccount(driveId: string): Promise<void> {
  await axiosInstance.delete(`/cloud/google/delete-drive/${driveId}`);
}

export async function deleteDriveFile(driveId: string, fileId: string): Promise<void> {
  await axiosInstance.delete(`/cloud/google/delete-file/${driveId}/${fileId}`);
}
