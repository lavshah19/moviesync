export const ROLES = ["jyotsan", "dipika"] as const;
export type Role = (typeof ROLES)[number];

// mirrors AuthUser in backend/src/modules/auth/types
export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
