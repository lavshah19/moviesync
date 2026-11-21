import api from "@/lib/axiosInstance";
import type { ApiResponse } from "@/modules/auth/types";
import type { Movie, MovieColumns } from "../types";

type MovieResponse = ApiResponse<{ movie: Movie }>;

export const movieApi = {
  list: (signal?: AbortSignal) =>
    api
      .get<ApiResponse<{ columns: MovieColumns }>>("/movies", { signal })
      .then((r) => r.data.data.columns),
  create: (movie: string) =>
    api.post<MovieResponse>("/movies", { movie }).then((r) => r.data.data.movie),
  update: (id: string, movie: string) =>
    api.patch<MovieResponse>(`/movies/${id}`, { movie }).then((r) => r.data.data.movie),
  setWatched: (id: string, watched: boolean) =>
    api.patch<MovieResponse>(`/movies/${id}/watched`, { watched }).then((r) => r.data.data.movie),
  remove: (id: string) => api.delete(`/movies/${id}`),
};
