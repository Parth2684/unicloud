import { create } from "zustand";
import { AuthState, AuthAction } from "./types";
import toast from "react-hot-toast";
import { fetchAuthToken, logoutRequest } from "@/api/auth";

export const useAuthStore = create<AuthState & AuthAction>((set) => ({
  authUser: null,
  isLoggedIn: false,
  token: null,

  setUser: (user) => {
    set({ authUser: user, isLoggedIn: true });
  },

  logout: async () => {
    try {
      await logoutRequest();
    } finally {
      set({ authUser: null, isLoggedIn: false, token: null });
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  },

  setToken: async () => {
    try {
      const token = await fetchAuthToken();
      set({ token });
    } catch (e) {
      console.error(e);
      toast.error("Failed to authenticate session");
    }
  },
}));
