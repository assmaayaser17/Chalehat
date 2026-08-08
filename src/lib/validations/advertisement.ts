import { z } from "zod";

export const advertisementSchema = z.object({
  name: z.string().min(2, "Advertisement name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price can't be negative"),
  categoryId: z.coerce.number().int().positive("Choose a category"),
  location: z.string().min(1, "Location is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

export type AdvertisementFormValues = z.infer<typeof advertisementSchema>;
