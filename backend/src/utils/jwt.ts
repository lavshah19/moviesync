import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

import createHttpError from "http-errors";
import type { IJwtPayload, IRefreshTokenPayload } from "../interfaces/jwt.interface.js";

const JWT_SECRET = env.JWT_SECRET;
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;

export const generateAccessToken = (payload: {
  id: string;
}) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" }); // for testing 15m later will be 1h
};
// Short-lived ticket for the socket handshake. The browser can't send the httpOnly cookie to
// the socket server (another origin in production), so it trades the cookie for this over HTTP.
// `purpose` keeps tickets and access tokens from standing in for each other (same secret).
const SOCKET_PURPOSE = "socket";

export const generateSocketTicket = (payload: { id: string }) => {
  return jwt.sign({ ...payload, purpose: SOCKET_PURPOSE }, JWT_SECRET, { expiresIn: "60s" });
};

export const verifySocketTicket = (ticket: string): IJwtPayload => {
  const decoded = jwt.verify(ticket, JWT_SECRET);
  if (typeof decoded !== "object" || !("id" in decoded) || decoded.purpose !== SOCKET_PURPOSE) {
    throw createHttpError.Unauthorized("Invalid socket ticket");
  }
  return decoded as IJwtPayload;
};

// unique jti: two tokens for the same user in the same second (register→login, double-click,
// two tabs refreshing) would otherwise be byte-identical and clash on RefreshToken.token @unique
export const generateRefreshToken = (payload: { id: string }) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d", jwtid: crypto.randomUUID() });
};

export const verifyAccessToken = (token: string): IJwtPayload => {
  const decoded = jwt.verify(token, JWT_SECRET);

  // a socket ticket is signed with the same secret: never accept it as an access token
  if (typeof decoded !== "object" || !("id" in decoded) || "purpose" in decoded) {
    throw createHttpError.Unauthorized("Invalid token payload");
  }

  return decoded as IJwtPayload;
};

export const verifyRefreshToken = (token: string): IRefreshTokenPayload=> {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET);

  if (typeof decoded !== "object" || !("id" in decoded)) {
    throw createHttpError.Unauthorized("Invalid refresh token payload");
  }

  return decoded as IRefreshTokenPayload;
};

export const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000;