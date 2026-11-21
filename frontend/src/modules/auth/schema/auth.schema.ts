import { z } from "zod";
import { ROLES } from "../types";

// Same rules as backend/src/modules/auth/validator/auth.validator.ts. The backend also
// normalises (collapses spaces, lowercases), so "Jyotsan  Hamal" logs in as "jyotsan hamal".
const username = z
  .string()
  .trim()
  .min(2, "Username must be at least 2 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[\p{L}\p{N} ._-]+$/u, "Use letters, numbers, spaces, . _ or -")
  .regex(/[\p{L}\p{N}]/u, "Username needs a letter or number");

export const loginSchema = z.object({
  username,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = loginSchema.extend({
  role: z.enum(ROLES, "Pick who you are"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
