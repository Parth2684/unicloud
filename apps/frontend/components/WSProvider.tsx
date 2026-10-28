"use client";

import { ReactNode, useEffect, useRef } from "react";
import { getSocket, sendWS } from "@/lib/ws-client";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import { useUserStore } from "@/stores/user/useUserStore";
import { Status } from "@/stores/user/types";
import { useCloudStore } from "@/stores/cloud/useCloudStore";
import { useNavigationStore } from "@/stores/navigation/useNavigationStore";
import { locationKey } from "@/stores/navigation/types";
import { toast } from "react-hot-toast";

export default function WSProvider({ children }: { children: ReactNode }) {
  const completedJobs = useRef(new Set<string>());
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
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (
        data?.job_type === "job_progress" &&
        typeof data.job_id === "string" &&
        typeof data.stage === "string" &&
        typeof data.progress === "number" &&
        Number.isFinite(data.progress)
      ) {
        // Completion is terminal, even if delayed progress events arrive afterwards.
        if (completedJobs.current.has(data.job_id)) return;
        const status = data.stage.toLowerCase();
        if (!Object.values(Status).includes(status as Status)) return;
        const complete = status === Status.Complete;
        const progress = complete ? 100 : Math.max(0, Math.min(100, data.progress));
        const jobs = useUserStore.getState().jobs;
        const editJob = jobs.find((job) => job.id == data.job_id);
        useUserStore.setState((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === data.job_id ? { ...job, status: status as Status, progress } : job,
          ),
        }));
        if (complete) {
          completedJobs.current.add(data.job_id);
          toast.success(editJob ? `${editJob.name} completed` : "Transfer completed");
          toast.dismiss(data.job_id, "job_progress");
          void useUserStore.getState().setJobs();

          // The progress payload has no destination folder, so refresh the visible listing.
          useNavigationStore.setState({ treeCache: {} });
          const { driveId, folderId } = useNavigationStore.getState();
          const cloud = useCloudStore.getState();
          if (driveId && cloud.folderLocation === locationKey(driveId, folderId)) {
            void cloud.setCurrentGoogleFolder(driveId, folderId);
          }
          return;
        }
        toast.custom(
          () => (
            <div className="w-80 rounded-lg border border-border bg-surface p-4 shadow-soft">
              <p className="text-sm text-foreground">{data.message}</p>
              <div className="mt-2 h-2 rounded bg-muted">
                <div
                  className="h-full rounded bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{progress}%</p>
            </div>
          ),
          {
            toasterId: "job_progress",
            id: data.job_id,
            duration: Infinity,
          },
        );
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
