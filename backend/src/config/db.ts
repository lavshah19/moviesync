import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

export async function connectDB() {
  await mongoose.connect(env.MONGODB_URI);
  logger.info("MongoDB connected");
}

export function disconnectDB() {
  return mongoose.disconnect();
}
