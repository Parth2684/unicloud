import { create } from 'zustand';
import { Status, UserAction, UserState } from './types';
import { axiosInstance } from '../../utils/axiosInstance';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';



export const useUserStore = create<UserState & UserAction>((set, get) => ({
  userInfo: null,
  jobs: null,
  
  setUserInfo: async () => {
    try {
      const res = await axiosInstance.get("/user/get-user-info")
      set({ userInfo: res.data.user_info })
    } catch (error) {
      console.error(error)
      if (error instanceof AxiosError && error.response?.data) {
        toast.error(error.response.data.message);
      }
    }
  },
  setJobs: async () => {
    try {
      const res = await axiosInstance.get("/user/get-jobs")
      set({ jobs: res.data.jobs })
    } catch (error) {
      console.error(error)
      if (error instanceof AxiosError && error.response?.data) {
        toast.error(error.response.data.message);
      }
    }
  },
  editJob: async(job_id: string, status: Status) => {
    try {
      const res = await axiosInstance.post("/user/edit-job", {
        id: job_id,
        status: status
      })
      set((state) => ({
        jobs: state.jobs?.map((job) => 
          job.id == job_id ? res.data.job : job
        )
      }))
    } catch (error) {
      console.error(error)
      if (error instanceof AxiosError && error.response?.data) {
        toast.error(error.response.data.message);
      }
    }
  }
}))