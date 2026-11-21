import { User } from "../models/user.model.js";
import type { SystemRole } from "../../../constant/role.js";
import { RefreshToken } from "../models/refreshToken.model.js";
import type { DeviceInfo } from "../types/index.js";

export class AuthRepository {
  static async findUserByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase() });
  }

  static async findUserById(id: string) {
    return User.findById(id);
  }

  static async createUser(
    email: string,
    password: string,
    fullName: string,
    role: SystemRole,
  ) {
    return User.create({ email, password, fullName, role });
  }

  static async updateUser(id: string, data: { fullName?: string }) {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  static async createRefreshToken(
    token: string,
    userId: string,
    expiresAt: Date,
    deviceInfo?: DeviceInfo,
  ) {
    return RefreshToken.create({
      token,
      userId,
      expiresAt,
      ipAddress: deviceInfo?.ipAddress,
      userAgent: deviceInfo?.userAgent,
      browser: deviceInfo?.browser,
      os: deviceInfo?.os,
      device: deviceInfo?.device ?? "desktop",
    });
  }

  static async deleteRefreshToken(token: string) {
    return RefreshToken.deleteMany({ token });
  }

  static async findRefreshToken(token: string) {
    return RefreshToken.findOne({ token });
  }
}
