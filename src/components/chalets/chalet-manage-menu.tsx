"use client";

import Link from "next/link";
import {
  BarChart3,
  CalendarCheck,
  CalendarClock,
  CalendarRange,
  ChevronDown,
  ImageUp,
  Settings2,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Client Component: consolidates the per-chalet management links behind one
 * menu instead of a busy button row. SuperAdmin only gets "Images" here —
 * amenities/pricing/bookings/statistics/reviews for a specific chalet are
 * the owning ChaletAdmin's job, not SuperAdmin's, per explicit request.
 */
export function ChaletManageMenu({ chaletId, isSuperAdmin = false }: { chaletId: number; isSuperAdmin?: boolean }) {
  const base = `/dashboard/chalets/${chaletId}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Settings2 /> Manage <ChevronDown className="ms-auto h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`${base}/images`}>
            <ImageUp /> Images
          </Link>
        </DropdownMenuItem>
        {!isSuperAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href={`${base}/amenities`}>
                <Sparkles /> Amenities
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`${base}/seasonal-prices`}>
                <CalendarRange /> Seasonal prices
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`${base}/weekday-prices`}>
                <CalendarClock /> Weekday prices
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`${base}/bookings`}>
                <CalendarCheck /> Bookings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`${base}/statistics`}>
                <BarChart3 /> Statistics
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`${base}/reviews`}>
                <Star /> Reviews
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
