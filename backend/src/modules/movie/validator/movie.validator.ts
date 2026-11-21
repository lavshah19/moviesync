import { z } from "zod";
import { MOVIE_MIN_YEAR, MOVIE_TITLE_MAX, movieMaxYear } from "../types/index.js";

// "Name - YYYY". Lazy name + anchored year means the LAST dash is the separator, so
// "Spider-Man - 2002" -> "Spider-Man", 2002. En/em dashes accepted: phone keyboards
// auto-replace "-" with "–".
const MOVIE_PATTERN = /^(.+?)\s*[-–—]\s*(\d{4})$/u;
const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const FORMAT_HINT = "Use the format: Movie name - YYYY (e.g. Titanic - 1997)";

// Parses the user's text into { title, year }, normalised ("Titanic-1997" -> "Titanic", 1997).
export const movieTextODT = z
  .string({ error: "Movie is required" })
  .trim()
  .min(1, "Movie is required")
  .max(MOVIE_TITLE_MAX + 10, "Movie name is too long")
  .transform((text, ctx) => {
    const match = MOVIE_PATTERN.exec(text);
    if (!match) {
      ctx.addIssue({ code: "custom", message: FORMAT_HINT });
      return z.NEVER;
    }

    const title = match[1].trim().replace(/\s+/g, " ");
    const year = Number(match[2]);

    if (!HAS_LETTER_OR_DIGIT.test(title)) {
      ctx.addIssue({ code: "custom", message: FORMAT_HINT });
      return z.NEVER;
    }
    if (title.length > MOVIE_TITLE_MAX) {
      ctx.addIssue({ code: "custom", message: "Movie name is too long" });
      return z.NEVER;
    }
    const maxYear = movieMaxYear();
    if (year < MOVIE_MIN_YEAR || year > maxYear) {
      ctx.addIssue({ code: "custom", message: `Year must be between ${MOVIE_MIN_YEAR} and ${maxYear}` });
      return z.NEVER;
    }

    return { title, year };
  });

export const createMovieODT = z.object({ movie: movieTextODT });
export const updateMovieODT = z.object({ movie: movieTextODT });
export const setWatchedODT = z.object({ watched: z.boolean({ error: "watched must be true or false" }) });

// Reject bad ids with a 422 here, instead of a Mongoose CastError turning into a 500.
export const movieIdParamsODT = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid movie id"),
});

export type MovieText = z.output<typeof movieTextODT>;
export type CreateMovieInput = z.output<typeof createMovieODT>;
export type UpdateMovieInput = z.output<typeof updateMovieODT>;
export type SetWatchedInput = z.output<typeof setWatchedODT>;
