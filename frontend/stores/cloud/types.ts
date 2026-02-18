export enum Provider {
  Google,
  Mega,
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  size?: number;
  createdTime?: string;
  modifiedTime?: string;
}

export enum Status {
  Pending,
  Running,
  Complete,
  Failed
}
export interface Job {
  created_at: Date,
  destination_email: string,
  destination_image?: string,
  fail_reason?: string,
  finished_at?: Date,
  from_drive?: String,
  id: String,
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
        
}

export interface ErrorCloudAccount {
  id: string;
  email: string;
  provider: Provider;
  tokenExpired: boolean;
  image?: string;
}

export interface SuccessCloudAccount {
  info: ErrorCloudAccount;
  storageQuota: {
    limit?: string;
    usageInDrive: string;
    usageInDriveTrash: string;
    usage: string;
  };
}

export interface SharedDrive {
  id: string;
  name: string;
}

export interface ClipboardItem {
  id: string;
  name: string;
  drive_id: string;
  operation: "copy" | "move";
}

export type CloudState = {
  loading: boolean;
  successCloudAccounts: SuccessCloudAccount[] | null;
  errorCloudAccounts: ErrorCloudAccount[] | null;
  drive: DriveFile[] | null;
  sharedDrives: SharedDrive[] | null;
  clipboard: ClipboardItem | null;
};

export type CloudActions = {
  setClouds: () => Promise<void>;
  setCurrentGoogleFolder: (drive_id: string, folder_id?: string) => Promise<void>;
  setSharedDrives: (drive_id: string) => Promise<void>;
  setClipboard: (id: string, name: string, drive_id: string, operation: "copy" | "move") => void;
  clearClipboard: () => void;
  pasteHere: (
    from_drive: string,
    from_file_id: string,
    to_drive: string,
    to_folder_id: string,
  ) => Promise<void>;
  deleteDrive: (drive_id: string, isExpired: boolean) => Promise<void>;
  deleteFile: (drive_id: string, file_id: string) => Promise<void>;
};
