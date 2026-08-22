"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBookingNotifications } from "@/hooks/use-booking-notifications";
import { getBookingByIdAction } from "@/lib/actions/chalet-booking-actions";
import { formatDate } from "@/lib/utils";
import type { BookingNotification, UserRole } from "@/lib/api/types";

/**
 * Client Component: live SignalR feed of new booking requests. Only a
 * ChaletAdmin gets notified about these (they're the one who'd otherwise
 * have to keep re-checking the bookings page), so this connects — and
 * renders — for that role only.
 */
export function NotificationBell({ role }: { role: UserRole }) {
  const router = useRouter();
  const enabled = role === "ChaletAdmin";
  const { notifications, unreadCount, markAllRead } = useBookingNotifications(enabled);

  if (!enabled) return null;

  async function handleSelect(notification: BookingNotification) {
    if (!notification.relatedBookingId) return;
    const result = await getBookingByIdAction(notification.relatedBookingId);
    if (result.success) {
      router.push(`/dashboard/chalets/${result.booking.chaletId}/bookings`);
    }
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) markAllRead();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex-col items-start gap-0.5 whitespace-normal"
              onClick={() => handleSelect(notification)}
            >
              <span className="font-medium text-foreground">{notification.title}</span>
              <span className="text-xs text-muted-foreground">{notification.message}</span>
              <span className="text-[10px] text-muted-foreground/70">{formatDate(notification.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
