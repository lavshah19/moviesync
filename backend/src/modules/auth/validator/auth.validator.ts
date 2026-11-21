import { z } from "zod";
import { SystemRoleName } from "../../../constant/role.js";

export const USERNAME_MIN = 2;
export const USERNAME_MAX = 30;

// Usernames are people's names ("jyotsan hamal"): letters, numbers, spaces and . _ -
// Normalised so logging in isn't fussy: trimmed, inner spaces collapsed, lowercased
// ("  Jyotsan   Hamal " = "jyotsan hamal"). The DB's unique index sees the same normal form.
export const normalizeUsername = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export const usernameODT = z
  .string({ error: "Username is required" })
  .transform(normalizeUsername)
  .pipe(
    z
      .string()
      .min(USERNAME_MIN, `Username must be at least ${USERNAME_MIN} characters`)
      .max(USERNAME_MAX, `Username must be at most ${USERNAME_MAX} characters`)
      .regex(/^[\p{L}\p{N} ._-]+$/u, "Use letters, numbers, spaces, . _ or -")
      .regex(/[\p{L}\p{N}]/u, "Username needs a letter or number"),
  );

const passwordODT = z.string().min(8, "Password must be at least 8 characters");

export const loginODT = z.object({
  username: usernameODT,
  password: passwordODT,
});

export const registerODT = z.object({
  username: usernameODT,
  password: passwordODT,
  role: z.enum(Object.values(SystemRoleName)),
});

export const updateProfileODT = z.object({
  username: usernameODT.optional(),
});

export type LoginInput = z.infer<typeof loginODT>;
export type RegisterInput = z.infer<typeof registerODT>;
export type UpdateProfileInput = z.infer<typeof updateProfileODT>;
