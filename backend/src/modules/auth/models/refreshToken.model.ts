import { Schema, model, type Types } from "mongoose";

export interface IRefreshToken {
  token: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device: string;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // ponytail: TTL index, Mongo deletes expired tokens itself, no cleanup job needed
    expiresAt: { type: Date, required: true, expires: 0 },
    ipAddress: String,
    userAgent: String,
    browser: String,
    os: String,
    device: { type: String, default: "desktop" },
  },
  { timestamps: true },
);

export const RefreshToken = model<IRefreshToken>("RefreshToken", refreshTokenSchema);
