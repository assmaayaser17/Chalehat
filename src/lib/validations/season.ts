import { z } from "zod";

export const seasonSchema = z
  .object({
    name: z.string().min(2, "Season name is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    priority: z.coerce.number().int().min(0, "Priority must be 0 or greater"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type SeasonFormValues = z.infer<typeof seasonSchema>;
