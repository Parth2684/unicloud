"use client";

import { ReactNode, useEffect, useRef } from "react";
import { getSocket, sendWS } from "../lib/ws-client";
import { useAuthStore } from "../stores/auth/useAuthStore";

export default function WSProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { setToken, token } = useAuthStore();

  useEffect(() => {
    setToken();
  }, [token]);
  useEffect(() => {
    if (!token) return;
    const ws = getSocket(token);
    if (!ws) return;
    wsRef.current = ws;

    const handleMessage = (event: MessageEvent) => {
      console.log("[WS MESSAGE]", event.data);
    };
    ws.addEventListener("message", handleMessage);

    const sendRefresh = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendWS("Refresh Token");
        sendWS("Transfer Status");
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
