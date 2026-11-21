import type { SystemRole } from "../../../constant/role.js";

export type DeviceInfo = {
  userAgent?: string;
  ipAddress?: string;
  browser?: string;
  os?: string;
  device?: string;
};

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: SystemRole;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
