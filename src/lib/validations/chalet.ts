import { z } from "zod";
import { BOOKING_TYPES } from "@/lib/api/types";

// The native `<input type="time">` returns "HH:mm" (no seconds) unless the
// form sets a `step` that enables a seconds picker, which we don't want in
// the UI. The API's own documented example for this field is "HH:mm:ss" —
// sending "HH:mm" risks a TimeSpan/TimeOnly deserialization failure on the
// backend that fails binding the *entire* request body (surfaces as a
// generic "The dto field is required" error, not a time-specific one). Pad
// the seconds on here instead of touching the input's UX.
const timeOfDaySchema = z
  .string()
  .min(1, "Time is required")
  .transform((value) => (value.length === 5 ? `${value}:00` : value));

// `ownerAdminId` is only present in the form when a non-ChaletAdmin (e.g.
// SuperAdmin) is creating the chalet on someone else's behalf — a ChaletAdmin
// creating their own chalet never sends it, the server action stamps their
// own session id instead. See `createChaletAction`.
export const createChaletSchema = z
  .object({
    name: z.string().min(3, "Chalet name is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    address: z.string().min(3, "Address is required"),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    basePrice: z.coerce.number().positive("Price must be greater than zero"),
    morningPrice: z.coerce.number().positive("Price must be greater than zero"),
    eveningPrice: z.coerce.number().positive("Price must be greater than zero"),
    showPrice: z.boolean(),
    maxGuests: z.coerce.number().int().positive("Max guests is required"),
    bedroomsCount: z.coerce.number().int().min(0),
    bathroomsCount: z.coerce.number().int().min(0),
    minNights: z.coerce.number().int().positive(),
    maxNights: z.coerce.number().int().positive(),
    checkInTime: timeOfDaySchema,
    checkOutTime: timeOfDaySchema,
    cancellationPolicy: z.string().min(3, "Cancellation policy is required"),
    whatsAppNumber: z.string().regex(/^0\d{8,9}$/, "Invalid WhatsApp number"),
    allowedBookingTypes: z.array(z.enum(BOOKING_TYPES)).min(1, "Choose at least one booking type"),
    ownerAdminId: z.string().optional(),
  })
  .refine((data) => data.maxNights >= data.minNights, {
    message: "Max nights must be greater than or equal to min nights",
    path: ["maxNights"],
  });

export type CreateChaletFormValues = z.infer<typeof createChaletSchema>;
