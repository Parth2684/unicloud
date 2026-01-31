import { WEBSOCKET_URL } from "./export";

let socket: WebSocket | null = null;

export function getSocket(token: string | null) {
  if (typeof window === "undefined") return null;

  if (socket && (
    socket.readyState === WebSocket.OPEN ||
    socket.readyState === WebSocket.CONNECTING
  )) {
    return socket;
  }

  if (!token) {
    console.warn("No token");
    return null;
  }

  const url = new URL(WEBSOCKET_URL);
  url.searchParams.append("token", token);

  socket = new WebSocket(url.toString());
  return socket;
}

export function sendWS(message: string) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(message);
  } else {
    console.warn("WS not open — message skipped:", message);
  }
}
