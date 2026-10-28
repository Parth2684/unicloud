import { axiosInstance } from "@/utils/axiosInstance";

export async function fetchAuthToken(): Promise<string> {
  const res = await axiosInstance.get("/auth/token");
  return res.data.auth_token as string;
}

export async function logoutRequest(): Promise<void> {
  await axiosInstance.post("/auth/logout");
}
