import axios from "axios";
import { BACKEND_URL } from "../lib/export";

export const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      window.location.pathname !== "/"
    ) {
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);
