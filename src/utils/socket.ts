import { io } from "socket.io-client";

// Use current origin so Socket.IO goes to same host (Vite proxy forwards /socket.io when in dev).
// This makes login and real-time work when opening the app from another device (e.g. --host).
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");

export const createSocket = (token?: string) => {
  return io(SOCKET_URL, {
    auth: token ? { token } : undefined,
  });
};
