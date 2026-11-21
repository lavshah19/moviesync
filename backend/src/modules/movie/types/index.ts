import type { SystemRole } from "../../../constant/role.js";

// First films are from 1888; allow next year so announced releases can be suggested.
export const MOVIE_MIN_YEAR = 1888;
export const movieMaxYear = () => new Date().getFullYear() + 1; // a function: the year rolls over
export const MOVIE_TITLE_MAX = 200;

// What the API returns for one movie (never the raw Mongo document).
export interface MovieDTO {
  id: string;
  title: string;
  year: number;
  forRole: SystemRole; // whose column it's in
  addedBy: string; // user id of the recommender
  watchedAt: Date | null;
  editedAt: Date | null;
  createdAt: Date;
}

// Both columns are always present, even when empty.
export type MovieColumns = Record<SystemRole, MovieDTO[]>;
