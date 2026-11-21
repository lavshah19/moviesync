import { UAParser } from "ua-parser-js";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import {
  daysToMs,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../../utils/jwt.js";
import type { AuthUser, DeviceInfo, IAuthResponse } from "../types/index.js";
import type { UpdateProfileInput } from "../validator/auth.validator.js";
import { AuthRepository } from "../repository/auth.repository.js";
import type { SystemRole } from "../../../constant/role.js";
import { isDuplicateKeyError } from "../../../utils/mongo.js";

const USERNAME_TAKEN = "That username is already taken.";

export class AuthService {
  static async login(username: string, password: string, deviceInfo?: DeviceInfo) {
    const user = await AuthRepository.findUserByUsername(username);
    if (!user) {
      throw new createHttpError.Unauthorized("Invalid credentials.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new createHttpError.Unauthorized("Invalid credentials.");
    }

    return AuthService.createTokenResponse(user, deviceInfo);
  }

  static async register(
    username: string,
    password: string,
    roleName: SystemRole,
    deviceInfo?: DeviceInfo,
  ) {
    // friendly early answers; the unique indexes below are what actually guarantee them
    const [usernameTaken, roleTaken] = await Promise.all([
      AuthRepository.findUserByUsername(username),
      AuthRepository.findUserByRole(roleName),
    ]);
    if (usernameTaken) throw new createHttpError.Conflict(USERNAME_TAKEN);
    if (roleTaken) throw new createHttpError.Conflict("This role is already taken.");

    const hashedPassword = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await AuthRepository.createUser(username, hashedPassword, roleName);
    } catch (err) {
      // two sign-ups racing past the checks above
      if (isDuplicateKeyError(err, "role")) {
        throw new createHttpError.Conflict("This role is already taken.");
      }
      if (isDuplicateKeyError(err, "username")) {
        throw new createHttpError.Conflict(USERNAME_TAKEN);
      }
      throw err;
    }

    return AuthService.createTokenResponse(user, deviceInfo);
  }

  static async logout(refreshToken?: string) {
    if (refreshToken) {
      await AuthRepository.deleteRefreshToken(refreshToken);
    }
  }

  // used on app start to hydrate the client's auth store from the accessToken cookie
  static async getCurrentUser(userId: string) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) {
      throw new createHttpError.Unauthorized("User not found.");
    }
    return AuthService.toAuthUser(user);
  }

  static toAuthUser(user: AuthUser): AuthUser {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  static async updateProfile(userId: string, input: UpdateProfileInput) {
    let user;
    try {
      user = await AuthRepository.updateUser(userId, input);
    } catch (err) {
      if (isDuplicateKeyError(err, "username")) throw new createHttpError.Conflict(USERNAME_TAKEN);
      throw err;
    }
    if (!user) throw new createHttpError.NotFound("User not found.");
    return AuthService.toAuthUser(user);
  }

  static async createTokenResponse(
    user: AuthUser,
    deviceInfo?: DeviceInfo,
  ): Promise<IAuthResponse> {
    const accessToken = generateAccessToken({ id: user.id });
    const refreshToken = generateRefreshToken({ id: user.id });

    await AuthRepository.createRefreshToken(
      refreshToken,
      user.id,
      new Date(Date.now() + daysToMs(7)),
      deviceInfo,
    );
    return {
      accessToken,
      refreshToken,
      user: AuthService.toAuthUser(user),
    };
  }

  // user.id is the ObjectId hex string; RefreshToken.userId is an ObjectId, so compare via toString().
  //
  // Rotates the refresh token on every use (delete the old row, issue a new one) rather
  // than just minting a fresh access token off the same refresh token — that's what lets
  // deviceInfo actually get recorded here, and it caps how long a stolen refresh token
  // stays usable if it's ever replayed after the legitimate client already rotated past it.
  static async refreshToken(
    token: string | undefined,
    deviceInfo?: DeviceInfo,
  ): Promise<IAuthResponse> {
    if (!token) {
      throw new createHttpError.Unauthorized("Refresh token is required.");
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new createHttpError.Unauthorized("Invalid or expired refresh token.");
    }

    const existingToken = await AuthRepository.findRefreshToken(token);
    if (
      !existingToken ||
      existingToken.userId.toString() !== decoded.id ||
      existingToken.expiresAt <= new Date()
    ) {
      throw new createHttpError.Unauthorized("Invalid or expired refresh token.");
    }

    const user = await AuthRepository.findUserById(decoded.id);
    if (!user) {
      throw new createHttpError.Unauthorized("User not found.");
    }

    await AuthRepository.deleteRefreshToken(token);

    return AuthService.createTokenResponse(user, deviceInfo);
  }

  static getDeviceInfo(userAgent?: string, ipAddress?: string): DeviceInfo {
    const result = new UAParser(userAgent).getResult();

    return {
      userAgent: userAgent ?? "unknown",
      ipAddress: ipAddress ?? "unknown",
      browser: result.browser.name ?? "unknown",
      os: result.os.name ?? "unknown",
      device: result.device.type ?? "desktop",
    };
  }
}
