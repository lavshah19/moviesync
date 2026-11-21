import type { Role } from "@/modules/auth/types";
import type { Movie } from "@/modules/movie/types";

// Mirrors backend/src/socket/events.ts; change both together.
export const SOCKET_EVENTS = {
  movieCreated: "movie:created",
  movieUpdated: "movie:updated", // edited, or ticked / unticked
  movieDeleted: "movie:deleted",
} as const;

export interface ServerToClientEvents {
  [SOCKET_EVENTS.movieCreated]: (payload: { movie: Movie }) => void;
  [SOCKET_EVENTS.movieUpdated]: (payload: { movie: Movie }) => void;
  [SOCKET_EVENTS.movieDeleted]: (payload: { id: string; forRole: Role }) => void;
}

// The socket only receives; writes go through the HTTP API.
export type ClientToServerEvents = Record<string, never>;

// The browser connects to the backend directly: Vercel rewrites don't proxy WebSockets, so this
// can't go through /api. Set NEXT_PUBLIC_SOCKET_URL on Vercel (build time) to the Render URL.
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3002";
