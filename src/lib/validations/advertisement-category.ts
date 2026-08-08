import { z } from "zod";

export const advertisementCategorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  iconUrl: z.union([z.string().trim().url("Invalid icon URL"), z.literal("")]),
});

export type AdvertisementCategoryFormValues = z.infer<typeof advertisementCategorySchema>;
