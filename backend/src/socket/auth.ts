import type { Socket } from "socket.io";
import { verifySocketTicket } from "../utils/jwt.js";
import { AuthRepository } from "../modules/auth/repository/auth.repository.js";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "./events.js";

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

// Handshake auth: the client sends { auth: { ticket } } (from GET /api/auth/socket-ticket).
// Errors reach the client as `connect_error` with this message; it fetches a new ticket and retries.
export async function socketAuth(socket: AppSocket, next: (err?: Error) => void) {
  const ticket: unknown = socket.handshake.auth?.ticket;
  if (typeof ticket !== "string" || !ticket) return next(new Error("NO_TICKET"));

  let userId: string;
  try {
    userId = verifySocketTicket(ticket).id;
  } catch {
    return next(new Error("INVALID_TICKET"));
  }

  // the ticket proves who they were 60s ago; make sure the account still exists
  try {
    if (!(await AuthRepository.findUserById(userId))) return next(new Error("USER_NOT_FOUND"));
  } catch (err) {
    return next(err instanceof Error ? err : new Error("AUTH_FAILED"));
  }

  socket.data.userId = userId;
  next();
}
