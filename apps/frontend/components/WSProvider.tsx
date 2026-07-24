"use client";

import { ReactNode, useEffect, useRef } from "react";
import { getSocket, sendWS } from "@/lib/ws-client";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import { useUserStore } from "@/stores/user/useUserStore";
import { toast } from "react-hot-toast";

export default function WSProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { setToken, token } = useAuthStore();

  useEffect(() => {
    if (!token) setToken();
  }, [token, setToken]);

  useEffect(() => {
    if (!token) return;
    const ws = getSocket(token);
    if (!ws) return;
    wsRef.current = ws;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.job_type === "job_progress") {
        const jobs = useUserStore.getState().jobs;
        const editJob = jobs.find((job) => job.id == data.job_id);
        toast.custom(
          () => (
            <div className="w-80 rounded-lg border border-border bg-surface p-4 shadow-soft">
              <p className="text-sm text-foreground">{data.message}</p>
              <div className="mt-2 h-2 rounded bg-muted">
                <div
                  className="h-full rounded bg-primary transition-all"
                  style={{ width: `${data.progress}%` }}
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{data.progress}%</p>
            </div>
          ),
          {
            toasterId: "job_progress",
            id: data.job_id,
            duration: Infinity,
          },
        );
        if (data.progress == 100) {
          toast.success(`${editJob?.name} completed`);
          toast.dismiss(data.job_id, "job_progress");
          void useUserStore.getState().setJobs();
        }
        useUserStore.setState((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === data.job_id
              ? {
                  ...job,
                  status: data.stage,
                  progress: data.progress,
                }
              : job,
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
      intervalRef.current = setInterval(sendRefresh, 4 * 60 * 1000);
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
      ws.removeEventListener("message", handleMessage);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token]);

  return children;
}
