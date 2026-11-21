import { Schema, model, type Types } from "mongoose";
import { SYSTEM_ROLES, type SystemRole } from "../../../constant/role.js";
import { MOVIE_MIN_YEAR, MOVIE_TITLE_MAX, movieMaxYear } from "../types/index.js";

export interface IMovie {
  title: string;
  year: number;
  forRole: SystemRole;
  addedBy: Types.ObjectId;
  watchedAt: Date | null;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// The zod validator is the user-facing check; these schema rules are the last line of defence
// for any write that doesn't go through it (scripts, future endpoints).
const movieSchema = new Schema<IMovie>(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: MOVIE_TITLE_MAX },
    year: {
      type: Number,
      required: true,
      min: MOVIE_MIN_YEAR,
      validate: {
        validator: (y: number) => Number.isInteger(y) && y <= movieMaxYear(),
        message: "Invalid year",
      },
    },
    // who owns the column / who suggested it never change after creation
    forRole: { type: String, enum: SYSTEM_ROLES, required: true, immutable: true },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    watchedAt: { type: Date, default: null },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One copy of a movie per column, case-insensitive ("titanic" = "Titanic").
// Strength 2 = ignore case, keep accents. Also serves the per-column lookups (forRole prefix).
movieSchema.index(
  { forRole: 1, title: 1, year: 1 },
  { unique: true, collation: { locale: "en", strength: 2 }, name: "unique_movie_per_column" },
);

export const Movie = model<IMovie>("Movie", movieSchema);
