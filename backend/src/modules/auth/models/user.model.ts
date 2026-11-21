import { Schema, model } from "mongoose";
import { SystemRoleName, type SystemRole } from "../../../constant/role.js";

export interface IUser {
  username: string;
  password: string;
  role: SystemRole;
  deletedAt: Date | null;
}

const userSchema = new Schema<IUser>(
  {
    // the login name; stored normalised (see normalizeUsername), so unique is case-insensitive
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    // unique: exactly one account per person (see PROJECT.md)
    role: { type: String, enum: Object.values(SystemRoleName), required: true, unique: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = model<IUser>("User", userSchema);
