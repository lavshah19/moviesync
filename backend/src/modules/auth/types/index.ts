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
  username: string;
  role: SystemRole;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
