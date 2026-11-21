import type { SystemRole } from "../constant/role.js";
import type { MovieDTO } from "../modules/movie/types/index.js";

// The socket contract. The frontend mirrors these names and payloads
// (frontend/src/modules/socket/events.ts); change both together.

export const SOCKET_EVENTS = {
  movieCreated: "movie:created",
  movieUpdated: "movie:updated", // edited, or ticked / unticked
  movieDeleted: "movie:deleted",
} as const;

// Exactly two people share one board, so every movie event goes to one room.
export const ROOMS = { board: "board" } as const;

export interface ServerToClientEvents {
  [SOCKET_EVENTS.movieCreated]: (payload: { movie: MovieDTO }) => void;
  [SOCKET_EVENTS.movieUpdated]: (payload: { movie: MovieDTO }) => void;
  [SOCKET_EVENTS.movieDeleted]: (payload: { id: string; forRole: SystemRole }) => void;
}

// Writes stay on the HTTP API (validation, auth, errors in one place); the socket only pushes.
export type ClientToServerEvents = Record<string, never>;

export interface SocketData {
  userId: string;
}
