import { z } from "zod";
import { phoneNumberSchema } from "@/lib/validations/auth";

export const createStaffSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters and numbers"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a digit"),
  role: z.enum(["SystemAdmin", "ChaletAdmin"], {
    errorMap: () => ({ message: "Choose a role" }),
  }),
  phoneNumber: phoneNumberSchema,
});

export type CreateStaffFormValues = z.infer<typeof createStaffSchema>;
