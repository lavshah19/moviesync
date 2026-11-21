import { z } from "zod";

// Same rules as backend/src/modules/movie/validator/movie.validator.ts, for instant feedback.
// The backend re-checks and normalises ("Titanic-1997" -> "Titanic - 1997"); we send the text as typed.
const MOVIE_PATTERN = /^(.+?)\s*[-–—]\s*(\d{4})$/u;
const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const MIN_YEAR = 1888;
const TITLE_MAX = 200;
const FORMAT_HINT = "Use the format: Movie name - YYYY (e.g. Titanic - 1997)";

export const movieFormSchema = z.object({
  movie: z
    .string()
    .trim()
    .min(1, "Type a movie first")
    .superRefine((text, ctx) => {
      const match = MOVIE_PATTERN.exec(text);
      const title = match?.[1].trim() ?? "";
      if (!match || !HAS_LETTER_OR_DIGIT.test(title)) {
        ctx.addIssue({ code: "custom", message: FORMAT_HINT });
        return;
      }
      if (title.length > TITLE_MAX) {
        ctx.addIssue({ code: "custom", message: "Movie name is too long" });
        return;
      }
      const year = Number(match[2]);
      const maxYear = new Date().getFullYear() + 1;
      if (year < MIN_YEAR || year > maxYear) {
        ctx.addIssue({
          code: "custom",
          message: `Year must be between ${MIN_YEAR} and ${maxYear}`,
        });
      }
    }),
});

export type MovieFormInput = z.infer<typeof movieFormSchema>;
