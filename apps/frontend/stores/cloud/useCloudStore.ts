import { create } from "zustand";
import { CloudActions, CloudState } from "./types";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useUserStore } from "../user/useUserStore";
import {
  copyFile,
  deleteDriveAccount,
  deleteDriveFile,
  fetchCloudAccounts,
  fetchFolderChildren,
  fetchSharedDrives,
} from "@/api/cloud";

export const useCloudStore = create<CloudState & CloudActions>((set) => ({
  loading: false,
  successCloudAccounts: null,
  errorCloudAccounts: null,
  drive: null,
  sharedDrives: null,
  clipboard: null,

  setClouds: async () => {
    set({ loading: true });
    try {
      const data = await fetchCloudAccounts();
      set({
        successCloudAccounts: data.google_drive_accounts,
        errorCloudAccounts: data.need_refresh,
      });
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Unexpected error fetching cloud accounts");
      }
    } finally {
      set({ loading: false });
    }
  },

  setCurrentGoogleFolder: async (drive_id, folder_id) => {
    set({ loading: true });
    try {
      const files = await fetchFolderChildren(drive_id, folder_id);
      set({ drive: files });
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Unexpected error fetching folder contents");
      }
    } finally {
      set({ loading: false });
    }
  },

  setSharedDrives: async (drive_id: string) => {
    set({ loading: true });
    try {
      const drives = await fetchSharedDrives(drive_id);
      set({ sharedDrives: drives });
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        toast.error(error.response.data.message);
      }
    } finally {
      set({ loading: false });
    }
  },

  setClipboard: (id, name, drive_id, operation) => {
    set({ clipboard: { id, name, drive_id, operation } });
  },
  clearClipboard: () => set({ clipboard: null }),

  pasteHere: async (from_drive, from_file_id, to_drive, to_folder_id) => {
    try {
      const data = await copyFile({ from_drive, from_file_id, to_drive, to_folder_id });
      useUserStore.setState((state) => ({
        jobs: [...state.jobs, data.job],
      }));
      toast.success(data.message);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        toast.error(error.response.data.message);
      }
    }
  },

  deleteDrive: async (drive_id) => {
    try {
      await deleteDriveAccount(drive_id);
      set((state) => ({
        errorCloudAccounts: state.errorCloudAccounts?.filter((acc) => acc.id !== drive_id),
        successCloudAccounts: state.successCloudAccounts?.filter((acc) => acc.info.id !== drive_id),
      }));
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        toast.error(error.response.data.message);
      }
    }
  },

  deleteFile: async (drive_id, file_id) => {
    try {
      await deleteDriveFile(drive_id, file_id);
      set((state) => ({
        drive: state.drive?.filter((file) => file.id !== file_id),
      }));
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        toast.error(error.response.data.message);
      }
    }
  },
}));
