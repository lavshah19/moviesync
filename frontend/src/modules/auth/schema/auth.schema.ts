import { z } from "zod";
import { ROLES } from "../types";

// same rules as backend/src/modules/auth/validator/auth.validator.ts
export const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = loginSchema.extend({
  fullName: z.string().trim().min(1, "Name is required"),
  role: z.enum(ROLES, "Pick who you are"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
