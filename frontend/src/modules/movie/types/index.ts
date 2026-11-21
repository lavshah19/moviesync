import type { Role } from "@/modules/auth/types";

// mirrors MovieDTO in backend/src/modules/movie/types (dates arrive as ISO strings)
export interface Movie {
  id: string;
  title: string;
  year: number;
  forRole: Role; // whose column it's in
  addedBy: string; // user id of the recommender
  watchedAt: string | null;
  editedAt: string | null;
  createdAt: string;
}

export type MovieColumns = Record<Role, Movie[]>;

export const movieLabel = (m: Pick<Movie, "title" | "year">) => `${m.title} - ${m.year}`;
