"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { previewBookingAction, createBookingAction } from "@/lib/actions/booking-actions";
import { BOOKING_TYPE_LABELS, buildBookingDays, formatCurrency, getActiveBookingTypes } from "@/lib/utils";
import type { BookingPreview, BookingType, Chalet, UserRole } from "@/lib/api/types";

/** Best-effort read of a total price out of the undocumented preview response shape. */
function readTotalPrice(preview: BookingPreview): number | null {
  for (const key of ["totalPrice", "total", "price", "amount"]) {
    const value = preview[key];
    if (typeof value === "number") return value;
  }
  return null;
}

/**
 * Client Component: the chalet detail page is public, so this renders
 * differently depending on whether the visitor is logged in and, if so,
 * whether they're a Customer (the only role the API lets book).
 *
 * The API has no availability-check endpoint, so dates aren't blocked out on
 * a calendar — conflicts only surface as an error from Preview/Create.
 */
export function ChaletBookingWidget({
  chalet,
  isLoggedIn,
  role,
}: {
  chalet: Chalet;
  isLoggedIn: boolean;
  role: UserRole | null;
}) {
  const pathname = usePathname();

  const activeTypes = getActiveBookingTypes(chalet.allowedBookingTypes);
  const firstActiveType = activeTypes[0];
  const [checkIn, setCheckIn] = React.useState("");
  const [checkOut, setCheckOut] = React.useState("");
  const [bookingType, setBookingType] = React.useState<BookingType | "">(firstActiveType ?? "");
  const [childrenCount, setChildrenCount] = React.useState("0");
  const [notes, setNotes] = React.useState("");

  const [preview, setPreview] = React.useState<BookingPreview | null>(null);
  const [previewedKey, setPreviewedKey] = React.useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [isBooking, setIsBooking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const formKey = JSON.stringify({ checkIn, checkOut, bookingType, childrenCount, notes });
  const isPreviewStale = preview !== null && previewedKey !== formKey;

  function buildRequest() {
    return {
      chaletId: chalet.id,
      bookingType: bookingType as BookingType,
      childrenCount: Number(childrenCount) || 0,
      notes,
      days: buildBookingDays(checkIn, checkOut),
    };
  }

  async function handlePreview() {
    setError(null);
    if (!checkIn || !checkOut) {
      setError("Choose a check-in and check-out date.");
      return;
    }
    if (checkOut < checkIn) {
      setError("Check-out must be on or after check-in.");
      return;
    }
    setIsPreviewing(true);
    try {
      const result = await previewBookingAction(buildRequest());
      if (!result.success) {
        setError(result.message);
        setPreview(null);
        return;
      }
      setPreview(result.preview);
      setPreviewedKey(formKey);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleConfirm() {
    setError(null);
    setIsBooking(true);
    try {
      const result = await createBookingAction(buildRequest());
      // A successful booking calls redirect() inside the action, which never
      // resolves back here — so reaching this line always means failure.
      if (!result.success) setError(result.message);
    } finally {
      setIsBooking(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="space-y-2 rounded-md border border-dashed border-border p-4 text-center">
        <p className="text-sm text-muted-foreground">Log in as a customer to book this chalet.</p>
        <Button asChild className="w-full">
          <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Log in to book</Link>
        </Button>
      </div>
    );
  }

  if (role !== "Customer") {
    return (
      <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        Only customer accounts can book a chalet.
      </p>
    );
  }

  const totalPrice = preview ? readTotalPrice(preview) : null;

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="checkIn">Check-in</Label>
          <Input
            id="checkIn"
            type="date"
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              setPreview(null);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="checkOut">Check-out</Label>
          <Input
            id="checkOut"
            type="date"
            value={checkOut}
            onChange={(e) => {
              setCheckOut(e.target.value);
              setPreview(null);
            }}
          />
        </div>
      </div>

      {activeTypes.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="bookingType">Booking type</Label>
          <Select
            value={bookingType}
            onValueChange={(value) => {
              setBookingType(value as BookingType);
              setPreview(null);
            }}
          >
            <SelectTrigger id="bookingType">
              <SelectValue placeholder="Choose a booking type" />
            </SelectTrigger>
            <SelectContent>
              {activeTypes.map((key) => (
                <SelectItem key={key} value={key}>
                  {BOOKING_TYPE_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="childrenCount">Children</Label>
        <Input
          id="childrenCount"
          type="number"
          min={0}
          value={childrenCount}
          onChange={(e) => {
            setChildrenCount(e.target.value);
            setPreview(null);
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          dir="auto"
          rows={2}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setPreview(null);
          }}
        />
      </div>

      {preview && !isPreviewStale && (
        <Alert variant="success">
          {totalPrice !== null ? (
            <>Estimated total: <strong>{formatCurrency(totalPrice)}</strong></>
          ) : (
            "Preview received — press confirm to book."
          )}
        </Alert>
      )}

      {preview && !isPreviewStale ? (
        <Button className="w-full" size="lg" loading={isBooking} onClick={handleConfirm}>
          <CalendarCheck /> Confirm booking
        </Button>
      ) : (
        <Button className="w-full" size="lg" variant="outline" disabled={isPreviewing} onClick={handlePreview}>
          {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck />}
          Preview price
        </Button>
      )}
    </div>
  );
}
