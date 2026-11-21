import { mongo } from "mongoose";

const DUPLICATE_KEY = 11000;

// Unique indexes are the source of truth for "already exists" (no check-then-insert race);
// map their error to a 409 at the call site. `field` narrows it to one index's key.
export const isDuplicateKeyError = (err: unknown, field?: string): boolean =>
  err instanceof mongo.MongoServerError &&
  err.code === DUPLICATE_KEY &&
  (!field || Object.hasOwn((err.keyPattern ?? {}) as object, field));
