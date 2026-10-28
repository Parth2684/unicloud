import { create } from "zustand";
import { Job, Status, UserAction, UserState } from "./types";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { editJobStatus, fetchJobs, fetchUserInfo } from "@/api/user";

export const useUserStore = create<UserState & UserAction>((set) => ({
  userInfo: null,
  jobs: [],

  setUserInfo: async () => {
    try {
      const userInfo = await fetchUserInfo();
      set({ userInfo });
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        toast.error(error.response.data.message);
      }
    }
  },

  setJobs: async () => {
    try {
      const jobs = await fetchJobs();
      jobs.forEach((job: Job) => {
        if (job.status === Status.Complete) job.progress = 100;
        if (job.status === Status.Pending) job.progress = 0;
        if (job.status === Status.Failed) job.progress = 0;
      });
      set({ jobs });
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        toast.error(error.response.data.message);
      }
    }
  },

  editJob: async (job_id, status) => {
    try {
      const job = await editJobStatus(job_id, status);
      set((state) => ({
        jobs: state.jobs?.map((j) => (j.id === job_id ? job : j)),
      }));
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        toast.error(error.response.data.message);
      }
    }
  },
}));
