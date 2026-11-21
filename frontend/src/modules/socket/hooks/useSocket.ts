"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { socketApi } from "../api/socket.api";
import {
  SOCKET_EVENTS,
  SOCKET_URL,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "../events";

export type SocketStatus = "connecting" | "live" | "offline";
type Handlers = Partial<ServerToClientEvents>;

const RETRY_AFTER_REFUSAL_MS = 5_000;

/**
 * One socket for as long as the calling component is mounted (the board: logged in).
 * - A fresh ticket is fetched on every connect and reconnect (they expire after 60s).
 * - After a reconnect, `onReconnect` runs so the caller can refetch what it missed offline.
 * - A refused handshake (bad/expired ticket) isn't retried by Socket.IO itself; we retry.
 * Handlers may change every render; the latest ones are always called.
 */
export function useSocket({
  handlers,
  onReconnect,
}: {
  handlers: Handlers;
  onReconnect?: () => void;
}) {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const handlersRef = useRef(handlers);
  const reconnectRef = useRef(onReconnect);
  useEffect(() => {
    handlersRef.current = handlers;
    reconnectRef.current = onReconnect;
  });

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"], // websocket first; polling if a network blocks it
      reconnectionDelayMax: 10_000,
      // called before every (re)connect attempt; an empty auth makes the server refuse
      // cleanly (NO_TICKET) instead of the attempt hanging
      auth: (cb) => {
        socketApi.ticket().then(
          (ticket) => cb({ ticket }),
          () => cb({}),
        );
      },
    });

    let connectedBefore = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    socket.on("connect", () => {
      setStatus("live");
      if (connectedBefore) reconnectRef.current?.();
      connectedBefore = true;
    });
    socket.on("disconnect", () => setStatus("offline"));
    socket.on("connect_error", () => {
      setStatus("offline");
      // network errors: Socket.IO retries by itself (socket.active). Server refusals: we do.
      if (!socket.active) retry = setTimeout(() => socket.connect(), RETRY_AFTER_REFUSAL_MS);
    });

    for (const event of Object.values(SOCKET_EVENTS)) {
      socket.on(event, ((payload: never) =>
        (handlersRef.current[event] as ((p: never) => void) | undefined)?.(payload)) as never);
    }

    // The browser knows about network loss long before Socket.IO's heartbeat does (up to ~45s,
    // and an open WebSocket can survive a drop silently). Show it at once, and when the
    // network is back force a fresh connection, which also refetches whatever was missed.
    const onOffline = () => setStatus("offline");
    const onOnline = () => {
      clearTimeout(retry);
      socket.disconnect().connect();
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    socket.connect();
    return () => {
      clearTimeout(retry);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      socket.disconnect();
    };
  }, []);

  return status;
}
