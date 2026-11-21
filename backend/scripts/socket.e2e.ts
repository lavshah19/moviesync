/**
 * End-to-end check of the realtime layer: handshake auth and the movie events, with two real
 * Socket.IO clients. Same isolation as movie.e2e.ts: a <db>_e2e database dropped before and after.
 *
 *   npm run test:e2e        (runs this after movie.e2e.ts)
 */
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

process.env.LOG_LEVEL = "silent";

async function main() {
  const { default: mongoose } = await import("mongoose");
  const { io: connect } = await import("socket.io-client");
  const { env } = await import("../src/config/env.js");
  const { default: app } = await import("../src/app.js");
  const { initSocket, closeSocket } = await import("../src/socket/index.js");
  const { User } = await import("../src/modules/auth/models/user.model.js");
  const { RefreshToken } = await import("../src/modules/auth/models/refreshToken.model.js");
  const { Movie } = await import("../src/modules/movie/models/movie.model.js");

  await mongoose.connect(env.MONGODB_URI);
  const dbName = `${mongoose.connection.db!.databaseName}_e2e`;
  await mongoose.disconnect();
  await mongoose.connect(env.MONGODB_URI, { dbName });
  assert.ok(mongoose.connection.db!.databaseName.endsWith("_e2e"), "refusing to drop a non-test db");
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), RefreshToken.init(), Movie.init()]);

  const server = app.listen(0);
  initSocket(server);
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const base = `${origin}/api`;
  const sockets: ReturnType<typeof connect>[] = [];

  const call = async (method: string, path: string, cookie = "", body?: unknown) => {
    const res = await fetch(base + path, {
      method,
      headers: { "content-type": "application/json", cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  };
  const register = async (role: string) => {
    const res = await fetch(base + "/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: `${role}@sock.test`, password: "password123", fullName: role, role }),
    });
    assert.equal(res.status, 201);
    return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  };
  const ticketFor = async (cookie: string) => (await call("GET", "/auth/socket-ticket", cookie)).body.data.ticket as string;

  // resolves with the connected socket, or rejects with the server's connect_error message
  const open = (auth?: { ticket: string }) =>
    new Promise<ReturnType<typeof connect>>((resolve, reject) => {
      const s = connect(origin, { auth, transports: ["websocket"], reconnection: false, forceNew: true });
      sockets.push(s);
      s.once("connect", () => resolve(s));
      s.once("connect_error", (err) => reject(err));
    });
  const next = (s: ReturnType<typeof connect>, event: string, ms = 2000) =>
    new Promise<any>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`no ${event} within ${ms}ms`)), ms);
      s.once(event, (payload: unknown) => {
        clearTimeout(t);
        resolve(payload);
      });
    });
  const silent = (s: ReturnType<typeof connect>, ms = 300) =>
    new Promise<void>((resolve, reject) => {
      const fail = (e: string) => () => reject(new Error(`unexpected ${e}`));
      const handlers = ["movie:created", "movie:updated", "movie:deleted"].map((e) => [e, fail(e)] as const);
      handlers.forEach(([e, h]) => s.on(e, h));
      setTimeout(() => {
        handlers.forEach(([e, h]) => s.off(e, h));
        resolve();
      }, ms);
    });

  let passed = 0;
  const check = async (name: string, fn: () => Promise<void> | void) => {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  };

  try {
    const he = await register("jyotsan");
    const she = await register("dipika");

    console.log("handshake");
    await check("no ticket is refused", async () => {
      await assert.rejects(open(), { message: "NO_TICKET" });
    });
    await check("garbage ticket is refused", async () => {
      await assert.rejects(open({ ticket: "nope" }), { message: "INVALID_TICKET" });
    });
    await check("an access token is not a ticket", async () => {
      const access = he.split("; ").find((c) => c.startsWith("accessToken="))!.split("=")[1];
      await assert.rejects(open({ ticket: access }), { message: "INVALID_TICKET" });
    });
    await check("and a ticket is not an access token", async () => {
      const ticket = await ticketFor(he);
      assert.equal((await call("GET", "/auth/me", `accessToken=${ticket}`)).status, 403);
    });
    await check("ticket endpoint needs login", async () => {
      assert.equal((await call("GET", "/auth/socket-ticket")).status, 401);
    });

    const heSock = await open({ ticket: await ticketFor(he) });
    const sheSock = await open({ ticket: await ticketFor(she) });
    await check("both connect with their own ticket", () => {
      assert.ok(heSock.connected && sheSock.connected);
    });

    console.log("events");
    let id = "";
    await check("add -> movie:created reaches both (sender's tabs too)", async () => {
      const [toHer, toHim, res] = await Promise.all([
        next(sheSock, "movie:created"),
        next(heSock, "movie:created"),
        call("POST", "/movies", he, { movie: "Titanic - 1997" }),
      ]);
      assert.equal(res.status, 201);
      id = res.body.data.movie.id;
      assert.deepEqual(toHer.movie, res.body.data.movie);
      assert.deepEqual(toHim.movie, res.body.data.movie);
    });
    await check("edit -> movie:updated with the new text", async () => {
      const [ev] = await Promise.all([
        next(sheSock, "movie:updated"),
        call("PATCH", `/movies/${id}`, he, { movie: "Titanic - 1998" }),
      ]);
      assert.equal(ev.movie.year, 1998);
      assert.ok(ev.movie.editedAt);
    });
    await check("tick -> movie:updated with watchedAt", async () => {
      const [ev] = await Promise.all([
        next(heSock, "movie:updated"),
        call("PATCH", `/movies/${id}/watched`, she, { watched: true }),
      ]);
      assert.ok(ev.movie.watchedAt);
    });
    await check("no-op tick (already watched) sends nothing", async () => {
      const quiet = silent(heSock);
      assert.equal((await call("PATCH", `/movies/${id}/watched`, she, { watched: true })).status, 200);
      await quiet;
    });
    await check("a rejected write sends nothing", async () => {
      await call("POST", "/movies", he, { movie: "Up - 2009" }); // then a duplicate
      await new Promise((r) => setTimeout(r, 100));
      const quiet = silent(sheSock);
      assert.equal((await call("POST", "/movies", he, { movie: "up - 2009" })).status, 409);
      assert.equal((await call("PATCH", `/movies/${id}`, he, { movie: "X - 2000" })).status, 409); // watched
      await quiet;
    });
    await check("remove -> movie:deleted with id and column", async () => {
      const [ev, res] = await Promise.all([
        next(sheSock, "movie:deleted"),
        call("DELETE", `/movies/${id}`, he),
      ]);
      assert.equal(res.status, 200);
      assert.deepEqual(ev, { id, forRole: "dipika" });
    });

    console.log(`\n${passed} checks passed`);
  } finally {
    sockets.forEach((s) => s.close());
    await closeSocket();
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
