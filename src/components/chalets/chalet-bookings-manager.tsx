"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { approveBookingAction, rejectBookingAction } from "@/lib/actions/chalet-booking-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Booking } from "@/lib/api/types";

type PendingAction = { bookingId: number; type: "approve" | "reject" };

/** Client Component: approve/reject open an inline mini-form in the row below, matching the AmenitiesList edit-row pattern. */
export function ChaletBookingsManager({ chaletId, bookings }: { chaletId: number; bookings: Booking[] }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(null);
  const [refundWindowHours, setRefundWindowHours] = React.useState("48");
  const [reason, setReason] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function startApprove(bookingId: number) {
    setError(null);
    setRefundWindowHours("48");
    setPendingAction({ bookingId, type: "approve" });
  }

  function startReject(bookingId: number) {
    setError(null);
    setReason("");
    setPendingAction({ bookingId, type: "reject" });
  }

  async function confirmApprove(bookingId: number) {
    setError(null);
    setIsSaving(true);
    try {
      const result = await approveBookingAction(bookingId, chaletId, Number(refundWindowHours) || 0);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setPendingAction(null);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmReject(bookingId: number) {
    setError(null);
    setIsSaving(true);
    try {
      const result = await rejectBookingAction(bookingId, chaletId, reason);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setPendingAction(null);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Children</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-52" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length > 0 ? (
            bookings.map((booking) => {
              const days = booking.days ?? [];
              const firstDay = days[0];
              const lastDay = days[days.length - 1];
              const isPending = booking.status === "Pending";
              const actionHere = pendingAction?.bookingId === booking.id ? pendingAction : null;

              return (
                <React.Fragment key={booking.id}>
                  <TableRow>
                    <TableCell className="font-medium">{booking.customerName ?? `#${booking.id}`}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {firstDay ? (
                        <>
                          {formatDate(firstDay.date)}
                          {lastDay && lastDay.date !== firstDay.date && ` – ${formatDate(lastDay.date)}`}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{booking.childrenCount ?? "—"}</TableCell>
                    <TableCell>
                      {typeof booking.totalPrice === "number" ? formatCurrency(booking.totalPrice) : "—"}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell>
                      {isPending && !actionHere && (
                        <div className="flex items-center gap-1">
                          <Button type="button" size="sm" onClick={() => startApprove(booking.id)}>
                            Approve
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => startReject(booking.id)}>
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>

                  {actionHere?.type === "approve" && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex flex-wrap items-end gap-3 rounded-md bg-muted p-3">
                          <div className="w-40 space-y-1.5">
                            <Label htmlFor={`refundWindow-${booking.id}`}>Refund window (hours)</Label>
                            <Input
                              id={`refundWindow-${booking.id}`}
                              type="number"
                              min={0}
                              value={refundWindowHours}
                              onChange={(e) => setRefundWindowHours(e.target.value)}
                            />
                          </div>
                          <Button type="button" size="sm" loading={isSaving} onClick={() => confirmApprove(booking.id)}>
                            <Check className="h-4 w-4" /> Confirm approval
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isSaving}
                            onClick={() => setPendingAction(null)}
                          >
                            <X className="h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {actionHere?.type === "reject" && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex flex-wrap items-end gap-3 rounded-md bg-muted p-3">
                          <div className="w-72 space-y-1.5">
                            <Label htmlFor={`reason-${booking.id}`}>Reason</Label>
                            <Textarea
                              id={`reason-${booking.id}`}
                              rows={2}
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="Chalet unavailable on selected date"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            loading={isSaving}
                            onClick={() => confirmReject(booking.id)}
                          >
                            <Check className="h-4 w-4" /> Confirm rejection
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isSaving}
                            onClick={() => setPendingAction(null)}
                          >
                            <X className="h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No bookings yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
