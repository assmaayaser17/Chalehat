import { z } from "zod";

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
    showPrice: z.boolean(),
    maxGuests: z.coerce.number().int().positive("Max guests is required"),
    bedroomsCount: z.coerce.number().int().min(0),
    bathroomsCount: z.coerce.number().int().min(0),
    minNights: z.coerce.number().int().positive(),
    maxNights: z.coerce.number().int().positive(),
    checkInTime: z.string().min(1, "Check-in time is required"),
    checkOutTime: z.string().min(1, "Check-out time is required"),
    cancellationPolicy: z.string().min(3, "Cancellation policy is required"),
    whatsAppNumber: z.string().regex(/^0\d{8,9}$/, "Invalid WhatsApp number"),
    allowedBookingTypes: z.coerce.number().int().min(1, "Choose at least one booking type"),
    ownerAdminId: z.string().optional(),
  })
  .refine((data) => data.maxNights >= data.minNights, {
    message: "Max nights must be greater than or equal to min nights",
    path: ["maxNights"],
  });

export type CreateChaletFormValues = z.infer<typeof createChaletSchema>;
