import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { socketAuth } from "./auth.js";
import {
  ROOMS,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from "./events.js";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

let io: AppServer | undefined;

// Attach Socket.IO to the HTTP server. The browser connects to the backend directly (Vercel
// rewrites don't proxy WebSockets), so CORS_ORIGIN must list the frontend's origin.
export function initSocket(server: HttpServer): AppServer {
  io = new Server(server, {
    cors: { origin: env.CORS_ORIGIN.length ? env.CORS_ORIGIN : false },
    serveClient: false,
  });

  io.use((socket, next) => void socketAuth(socket, next));

  io.on("connection", (socket) => {
    void socket.join(ROOMS.board);
    logger.debug({ userId: socket.data.userId, socketId: socket.id }, "socket connected");
    socket.on("disconnect", (reason) => {
      logger.debug({ userId: socket.data.userId, reason }, "socket disconnected");
    });
  });

  return io;
}

// Push an event to everyone on the board, the sender's own tabs included (clients apply events
// idempotently: upsert / remove by id). A no-op when no socket server runs (scripts, tests).
export function broadcast<E extends keyof ServerToClientEvents>(
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
) {
  io?.to(ROOMS.board).emit(event, ...args);
}

export function closeSocket(): Promise<void> {
  return new Promise((resolve) => {
    if (!io) return resolve();
    // disconnects every client so the HTTP server can drain; also closes the HTTP server
    void io.close(() => resolve());
  });
}
