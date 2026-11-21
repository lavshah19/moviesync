export const ROLES = ["jyotsan", "dipika"] as const;
export type Role = (typeof ROLES)[number];

// mirrors AuthUser in backend/src/modules/auth/types
export interface AuthUser {
  id: string;
  username: string; // normalised: lowercase, single spaces
  role: Role;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
