import { Schema, model } from "mongoose";
import { SystemRoleName, type SystemRole } from "../../../constant/role.js";

export interface IUser {
  email: string;
  password: string;
  fullName: string | null;
  role: SystemRole;
  deletedAt: Date | null;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, default: null },
    role: { type: String, enum: Object.values(SystemRoleName), required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = model<IUser>("User", userSchema);
