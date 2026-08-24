import { z } from "zod";

export const createCustomerCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export type CreateCustomerCategoryFormValues = z.infer<typeof createCustomerCategorySchema>;
