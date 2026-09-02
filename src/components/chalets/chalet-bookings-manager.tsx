"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, TriangleAlert, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import {
  approveBookingAction,
  approveBookingAndRejectConflictsAction,
  getBookingConflictsAction,
  getCustomerBalanceAction,
  recordBookingPaymentAction,
  rejectBookingAction,
} from "@/lib/actions/chalet-booking-actions";
import { addCustomerReviewAction, getCustomerBookingStatsAction } from "@/lib/actions/customer-review-actions";
import { formatCurrency, formatDate, summarizeBookingPeriods } from "@/lib/utils";
import type { Booking, CustomerBalance, CustomerBookingStats } from "@/lib/api/types";

type PendingAction =
  | { bookingId: number; type: "approve"; conflicts: Booking[] }
  | { bookingId: number; type: "reject" }
  | { bookingId: number; type: "pay" }
  | { bookingId: number; type: "review" };

const DEFAULT_CONFLICT_REASON = "Another booking for the same dates was approved.";

/**
 * The real field is `userFullName` (often an empty string, not omitted) —
 * `customerName` is a defensive fallback only. `customerNamesById` (built
 * from `GET /api/Admin/by-role/Customer`, keyed by `userId`) is checked
 * first since it's the one source that reliably has a real name — see the
 * page's doc comment on why the booking endpoint itself can't be trusted for this.
 */
function customerLabel(booking: Booking, customerNamesById: Record<string, string>): string {
  const backfilled = booking.userId ? customerNamesById[booking.userId] : undefined;
  return backfilled || booking.userFullName || booking.customerName || `#${booking.id}`;
}

/** Renders one booking's summary line — reused for the row itself and for the conflicting bookings listed under it. */
function BookingSummary({
  booking,
  customerNamesById,
}: {
  booking: Booking;
  customerNamesById: Record<string, string>;
}) {
  const days = booking.days ?? [];
  const firstDay = days[0];
  const lastDay = days[days.length - 1];
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span dir="auto" className="font-medium text-foreground">
        {customerLabel(booking, customerNamesById)}
      </span>
      <span className="text-muted-foreground">
        {firstDay ? (
          <>
            {formatDate(firstDay.date)}
            {lastDay && lastDay.date !== firstDay.date && ` – ${formatDate(lastDay.date)}`}
          </>
        ) : (
          "—"
        )}
      </span>
      <Badge variant="outline">{summarizeBookingPeriods(booking.days)}</Badge>
      {typeof booking.totalPrice === "number" && <span className="font-medium">{formatCurrency(booking.totalPrice)}</span>}
    </div>
  );
}

/** Client Component: approve/reject open an inline mini-form in the row below, matching the AmenitiesList edit-row pattern. */
export function ChaletBookingsManager({
  chaletId,
  bookings,
  bookingDatesById = {},
  customerNamesById = {},
}: {
  chaletId: number;
  bookings: Booking[];
  /** bookingId (as a string key) -> sorted dates, built from the chalet calendar for whatever month is currently displayed — see `buildBookingDatesById`. */
  bookingDatesById?: Record<string, string[]>;
  /** userId -> fullName, backfilled from `GET /api/Admin/by-role/Customer` since the booking endpoint's own name field is unreliable — see `customerLabel`. */
  customerNamesById?: Record<string, string>;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(null);
  const [loadingConflictsFor, setLoadingConflictsFor] = React.useState<number | null>(null);
  const [refundWindowHours, setRefundWindowHours] = React.useState("48");
  const [reason, setReason] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("Cash");

  const [reviewCleanliness, setReviewCleanliness] = React.useState("3");
  const [reviewDisturbance, setReviewDisturbance] = React.useState("3");
  const [reviewPaymentReliability, setReviewPaymentReliability] = React.useState("3");
  const [reviewNotes, setReviewNotes] = React.useState("");

  const [balanceFor, setBalanceFor] = React.useState<number | null>(null);
  const [balance, setBalance] = React.useState<CustomerBalance | null>(null);
  const [bookingStats, setBookingStats] = React.useState<CustomerBookingStats | null>(null);
  const [balanceLoading, setBalanceLoading] = React.useState(false);
  const [balanceError, setBalanceError] = React.useState<string | null>(null);

  async function startApprove(bookingId: number) {
    setError(null);
    setRefundWindowHours("48");
    setLoadingConflictsFor(bookingId);
    try {
      const result = await getBookingConflictsAction(bookingId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      // Pending-only: an already Confirmed/Rejected conflict isn't a live contender.
      const conflicts = result.conflicts.filter((c) => c.status === "Pending");
      setReason(DEFAULT_CONFLICT_REASON);
      setPendingAction({ bookingId, type: "approve", conflicts });
    } finally {
      setLoadingConflictsFor(null);
    }
  }

  function startReject(bookingId: number) {
    setError(null);
    setReason("");
    setPendingAction({ bookingId, type: "reject" });
  }

  async function confirmApprove(bookingId: number, conflicts: Booking[]) {
    setError(null);
    setIsSaving(true);
    try {
      const result =
        conflicts.length > 0
          ? await approveBookingAndRejectConflictsAction(
              bookingId,
              chaletId,
              Number(refundWindowHours) || 0,
              conflicts.map((c) => c.id),
              reason,
            )
          : await approveBookingAction(bookingId, chaletId, Number(refundWindowHours) || 0);
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

  function startPay(bookingId: number) {
    setError(null);
    setPaymentAmount("");
    setPaymentMethod("Cash");
    setPendingAction({ bookingId, type: "pay" });
  }

  async function confirmPay(bookingId: number) {
    setError(null);
    setIsSaving(true);
    try {
      const result = await recordBookingPaymentAction(bookingId, chaletId, Number(paymentAmount) || 0, paymentMethod);
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

  function startReview(bookingId: number) {
    setError(null);
    setReviewCleanliness("3");
    setReviewDisturbance("3");
    setReviewPaymentReliability("3");
    setReviewNotes("");
    setPendingAction({ bookingId, type: "review" });
  }

  async function confirmReview(bookingId: number, userId: string) {
    setError(null);
    setIsSaving(true);
    try {
      const result = await addCustomerReviewAction(
        userId,
        chaletId,
        Number(reviewCleanliness) || 0,
        Number(reviewDisturbance) || 0,
        Number(reviewPaymentReliability) || 0,
        reviewNotes,
      );
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

  async function toggleBalance(bookingId: number, userId: string) {
    if (balanceFor === bookingId) {
      setBalanceFor(null);
      return;
    }
    setBalanceError(null);
    setBalance(null);
    setBookingStats(null);
    setBalanceFor(bookingId);
    setBalanceLoading(true);
    try {
      const [balanceResult, statsResult] = await Promise.all([
        getCustomerBalanceAction(userId),
        getCustomerBookingStatsAction(userId),
      ]);
      if (balanceResult.success) setBalance(balanceResult.balance);
      if (statsResult.success) setBookingStats(statsResult.stats);
      if (!balanceResult.success && !statsResult.success) {
        setBalanceError(balanceResult.message);
      }
    } finally {
      setBalanceLoading(false);
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
            <TableHead>Type</TableHead>
            <TableHead>Children</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-52" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length > 0 ? (
            bookings.map((booking) => {
              // `days` is populated on this endpoint (confirmed live) — the
              // calendar-derived lookup is kept only as a defensive fallback
              // for the rare booking where it isn't (see `bookingDatesById`'s
              // doc comment).
              const ownDates = (booking.days ?? []).map((d) => d.date);
              const fallbackDates = bookingDatesById[String(booking.id)] ?? [];
              const dates = ownDates.length > 0 ? ownDates : fallbackDates;
              const firstDate = dates[0];
              const lastDate = dates[dates.length - 1];
              const isPending = booking.status === "Pending";
              const actionHere = pendingAction?.bookingId === booking.id ? pendingAction : null;
              const isLoadingConflicts = loadingConflictsFor === booking.id;

              return (
                <React.Fragment key={booking.id}>
                  <TableRow>
                    <TableCell dir="auto" className="font-medium">
                      {customerLabel(booking, customerNamesById)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {firstDate ? (
                        <>
                          {formatDate(firstDate)}
                          {lastDate && lastDate !== firstDate && ` – ${formatDate(lastDate)}`}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{summarizeBookingPeriods(booking.days)}</Badge>
                    </TableCell>
                    <TableCell>{booking.childrenCount ?? "—"}</TableCell>
                    <TableCell>
                      {typeof booking.totalPrice === "number" ? formatCurrency(booking.totalPrice) : "—"}
                      {typeof booking.paidAmount === "number" && booking.paidAmount > 0 && (
                        <p className="text-xs text-success">Paid {formatCurrency(booking.paidAmount)}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {isPending && !actionHere && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              loading={isLoadingConflicts}
                              onClick={() => startApprove(booking.id)}
                            >
                              Approve
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => startReject(booking.id)}>
                              Reject
                            </Button>
                          </>
                        )}
                        {booking.userId && !actionHere && (
                          <Button type="button" size="sm" variant="ghost" onClick={() => startPay(booking.id)}>
                            Pay
                          </Button>
                        )}
                        {booking.userId && !actionHere && (
                          <Button type="button" size="sm" variant="ghost" onClick={() => startReview(booking.id)}>
                            Review
                          </Button>
                        )}
                        {booking.userId && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            loading={balanceLoading && balanceFor === booking.id}
                            onClick={() => toggleBalance(booking.id, booking.userId as string)}
                          >
                            Customer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {balanceFor === booking.id && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="space-y-3 rounded-md bg-muted p-3 text-sm">
                          {balanceLoading ? (
                            <span className="text-muted-foreground">Loading…</span>
                          ) : (
                            <>
                              {balanceError && <span className="text-destructive">{balanceError}</span>}
                              {balance && (
                                <div className="flex flex-wrap gap-x-6 gap-y-1">
                                  {typeof balance.totalOwed === "number" && (
                                    <span>
                                      Total owed: <strong className="font-semibold">{formatCurrency(balance.totalOwed)}</strong>
                                    </span>
                                  )}
                                  {typeof balance.totalPaid === "number" && (
                                    <span>
                                      Total paid: <strong className="font-semibold">{formatCurrency(balance.totalPaid)}</strong>
                                    </span>
                                  )}
                                  {typeof balance.balance === "number" && (
                                    <span>
                                      Balance: <strong className="font-semibold">{formatCurrency(balance.balance)}</strong>
                                    </span>
                                  )}
                                </div>
                              )}
                              {bookingStats && (
                                <div className="space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
                                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                                    {(bookingStats.cleanlinessRating ?? 0) > 0 && (
                                      <span>Cleanliness {bookingStats.cleanlinessRating}/5</span>
                                    )}
                                    {(bookingStats.disturbanceRating ?? 0) > 0 && (
                                      <span>Disturbance {bookingStats.disturbanceRating}/5</span>
                                    )}
                                    {(bookingStats.paymentReliabilityRating ?? 0) > 0 && (
                                      <span>Payment reliability {bookingStats.paymentReliabilityRating}/5</span>
                                    )}
                                  </div>
                                  {bookingStats.adminNotes && <p dir="auto">{bookingStats.adminNotes}</p>}
                                </div>
                              )}
                              {!balance && !bookingStats && !balanceError && (
                                <span className="text-muted-foreground">No details available for this customer.</span>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {actionHere?.type === "pay" && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="flex flex-wrap items-end gap-3 rounded-md bg-muted p-3">
                          <div className="w-32 space-y-1.5">
                            <Label htmlFor={`pay-amount-${booking.id}`}>Amount</Label>
                            <Input
                              id={`pay-amount-${booking.id}`}
                              type="number"
                              min={0}
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                          </div>
                          <div className="w-40 space-y-1.5">
                            <Label htmlFor={`pay-method-${booking.id}`}>Payment method</Label>
                            <Input
                              id={`pay-method-${booking.id}`}
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              placeholder="Cash"
                            />
                          </div>
                          <Button type="button" size="sm" loading={isSaving} onClick={() => confirmPay(booking.id)}>
                            <Check className="h-4 w-4" /> Record payment
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

                  {actionHere?.type === "review" && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="space-y-3 rounded-md bg-muted p-3">
                          <div className="flex flex-wrap items-end gap-3">
                            <div className="w-32 space-y-1.5">
                              <Label htmlFor={`review-cleanliness-${booking.id}`}>Cleanliness (1–5)</Label>
                              <Input
                                id={`review-cleanliness-${booking.id}`}
                                type="number"
                                min={1}
                                max={5}
                                value={reviewCleanliness}
                                onChange={(e) => setReviewCleanliness(e.target.value)}
                              />
                            </div>
                            <div className="w-32 space-y-1.5">
                              <Label htmlFor={`review-disturbance-${booking.id}`}>Disturbance (1–5)</Label>
                              <Input
                                id={`review-disturbance-${booking.id}`}
                                type="number"
                                min={1}
                                max={5}
                                value={reviewDisturbance}
                                onChange={(e) => setReviewDisturbance(e.target.value)}
                              />
                            </div>
                            <div className="w-44 space-y-1.5">
                              <Label htmlFor={`review-payment-${booking.id}`}>Payment reliability (1–5)</Label>
                              <Input
                                id={`review-payment-${booking.id}`}
                                type="number"
                                min={1}
                                max={5}
                                value={reviewPaymentReliability}
                                onChange={(e) => setReviewPaymentReliability(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`review-notes-${booking.id}`}>Notes</Label>
                            <Textarea
                              id={`review-notes-${booking.id}`}
                              dir="auto"
                              rows={2}
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              placeholder="Customer was very cooperative and payment was completed on time"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              size="sm"
                              loading={isSaving}
                              onClick={() => confirmReview(booking.id, booking.userId as string)}
                            >
                              <Check className="h-4 w-4" /> Submit review
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
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {actionHere?.type === "approve" && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="space-y-3 rounded-md bg-muted p-3">
                          {actionHere.conflicts.length > 0 && (
                            <div className="space-y-2 rounded-md border border-warning/30 bg-warning/10 p-3">
                              <p className="flex items-center gap-1.5 text-sm font-medium text-warning">
                                <TriangleAlert className="h-4 w-4 shrink-0" />
                                {actionHere.conflicts.length} other pending request
                                {actionHere.conflicts.length > 1 ? "s" : ""} for overlapping dates
                              </p>
                              <div className="space-y-1.5">
                                {actionHere.conflicts.map((c) => (
                                  <BookingSummary key={c.id} booking={c} customerNamesById={customerNamesById} />
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Approving this booking will reject the request(s) above with the reason below.
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap items-end gap-3">
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
                            {actionHere.conflicts.length > 0 && (
                              <div className="w-72 space-y-1.5">
                                <Label htmlFor={`conflict-reason-${booking.id}`}>Reason for rejecting the others</Label>
                                <Textarea
                                  id={`conflict-reason-${booking.id}`}
                                  rows={2}
                                  value={reason}
                                  onChange={(e) => setReason(e.target.value)}
                                />
                              </div>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              loading={isSaving}
                              onClick={() => confirmApprove(booking.id, actionHere.conflicts)}
                            >
                              <Check className="h-4 w-4" />
                              {actionHere.conflicts.length > 0
                                ? `Approve & reject the others (${actionHere.conflicts.length})`
                                : "Confirm approval"}
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
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {actionHere?.type === "reject" && (
                    <TableRow>
                      <TableCell colSpan={7}>
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
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No bookings yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
