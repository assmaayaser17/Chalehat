import { Badge, type BadgeProps } from "@/components/ui/badge";

/** Status strings aren't documented by the API — unrecognized values still render, just with a neutral outline. */
const STATUS_VARIANTS: Record<string, NonNullable<BadgeProps["variant"]>> = {
  Pending: "outline",
  Confirmed: "success",
  Rejected: "destructive",
  Cancelled: "destructive",
  Completed: "default",
};

export function BookingStatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANTS[status] ?? "outline"}>{status}</Badge>;
}
