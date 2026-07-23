"use client";

import { ReactNode, useEffect, useRef } from "react";
import { getSocket, sendWS } from "../lib/ws-client";
import { useAuthStore } from "../stores/auth/useAuthStore";
import { useUserStore } from "@/stores/user/useUserStore";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function WSProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { setToken, token } = useAuthStore();
  const router = useRouter()

  useEffect(() => {
    setToken();
  }, [token]);
  useEffect(() => {
    if (!token) return;
    const ws = getSocket(token);
    if (!ws) return;
    wsRef.current = ws;

    const handleMessage = (event: MessageEvent) => {
      let data = JSON.parse(event.data);
      console.log(data)
      if (data.job_type === "job_progress") {
        let jobs = useUserStore.getState().jobs;
        let editJob = jobs.find((job) => job.id == data.job_id);
        toast.custom(
          (t) => (
            <div className="bg-white rounded-lg shadow p-4 w-80">
              <p>{data.message}</p>

              <div className="mt-2 h-2 bg-gray-200 rounded">
                <div className="h-full bg-blue-500 rounded" style={{ width: `${data.progress}%` }} />
              </div>

              <p className="mt-1 text-sm">{data.progress}%</p>
            </div>
          ),
          {
            toasterId: "job_progress",
            id: data.job_id,
            duration: Infinity,
          },
        );
        if (data.progress == 100) {
          toast.success(`${editJob?.name} completed`)
          toast.dismiss(data.job_id, "job_progress")
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
        useUserStore.setState((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === data.job_id
              ? {
                  ...job,
                  status: data.stage,
                  progress: data.progress,
                }
              : job
          ),
        }));
      }
    };
    ws.addEventListener("message", handleMessage);

    const sendRefresh = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendWS("Refresh Token");
      }
    };

    const startInterval = () => {
      if (intervalRef.current) return;

      intervalRef.current = setInterval(
        () => {
          sendRefresh();
        },
        4 * 60 * 1000,
      );
    };

    const handleOpen = () => {
      sendRefresh();
      startInterval();
    };

    const handleClose = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    ws.addEventListener("open", handleOpen);
    ws.addEventListener("close", handleClose);

    if (ws.readyState === WebSocket.OPEN) {
      handleOpen();
    }

    return () => {
      ws.removeEventListener("open", handleOpen);
      ws.removeEventListener("close", handleClose);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token]);

  return children;
}
