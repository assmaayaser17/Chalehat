import { z } from "zod";

export const amenitySchema = z.object({
  name: z.string().min(2, "Amenity name is required"),
  iconUrl: z.union([z.string().trim().url("Invalid icon URL"), z.literal("")]),
});

export type AmenityFormValues = z.infer<typeof amenitySchema>;
