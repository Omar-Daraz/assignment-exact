"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { Task } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export interface NotificationData {
  eventType: string;
  task: Task | { id: string; title?: string };
  message: string;
  timestamp: string;
}

export const useWebSocket = (
  onNotification?: (notification: NotificationData) => void
) => {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    socket.on("connected", (data) => {
      console.log("WebSocket connection confirmed:", data);
    });

    socket.on("task-update", (data: { eventType: string; task: Task }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    });

    socket.on("task-assigned", (data: { eventType: string; task: Task }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    });

    socket.on("task-created", (data: { eventType: string; task: Task }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    });

    socket.on("task-notification", (data: NotificationData) => {
      console.log("Received task notification:", data);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (onNotification) {
        onNotification(data);
      }
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, token, queryClient, onNotification]);

  return socketRef.current;
};
