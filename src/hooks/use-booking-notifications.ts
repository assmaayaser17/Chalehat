"use client";

import * as React from "react";
import * as signalR from "@microsoft/signalr";
import type { BookingNotification } from "@/lib/api/types";

const HUB_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://chalehat.onrender.com"}/hubs/notification`;

async function fetchAccessToken(): Promise<string> {
  const res = await fetch("/api/notifications-token", { cache: "no-store" });
  if (!res.ok) throw new Error("Not authenticated");
  const data = (await res.json()) as { accessToken: string };
  return data.accessToken;
}

const MAX_KEPT = 30;

/**
 * Connects to the backend's `ReceiveNotification` SignalR hub and keeps a
 * running list of what's come in, for `NotificationBell`. `enabled` should
 * be false for any role that shouldn't hold this connection open (currently
 * ChaletAdmin only — that's who gets notified about new booking requests).
 */
export function useBookingNotifications(enabled: boolean) {
  const [notifications, setNotifications] = React.useState<BookingNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: fetchAccessToken })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    connection.on("ReceiveNotification", (notification: BookingNotification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, MAX_KEPT));
      setUnreadCount((prev) => prev + 1);
    });
    connection.onreconnected(() => setIsConnected(true));
    connection.onreconnecting(() => setIsConnected(false));
    connection.onclose(() => setIsConnected(false));

    connection
      .start()
      .then(() => setIsConnected(true))
      .catch((err) => {
        console.error("Couldn't connect to the notification hub:", err);
        setIsConnected(false);
      });

    return () => {
      connection.stop();
    };
  }, [enabled]);

  const markAllRead = React.useCallback(() => setUnreadCount(0), []);

  return { notifications, unreadCount, isConnected, markAllRead };
}
