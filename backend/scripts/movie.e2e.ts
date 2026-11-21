/**
 * End-to-end check of the movie rules in PROJECT.md, through the real HTTP API.
 * Uses a separate database (<db>_e2e) that is dropped before and after: dev data is never touched.
 *
 *   npm run test:e2e        (needs MongoDB running, same as `npm run dev`)
 */
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

process.env.LOG_LEVEL = "silent"; // before the app (and its logger) is imported

type Res = { status: number; body: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

async function main() {

  const { default: mongoose } = await import("mongoose");
  const { env } = await import("../src/config/env.js");
  const { default: app } = await import("../src/app.js");
  const { User } = await import("../src/modules/auth/models/user.model.js");
  const { RefreshToken } = await import("../src/modules/auth/models/refreshToken.model.js");
  const { Movie } = await import("../src/modules/movie/models/movie.model.js");

  await mongoose.connect(env.MONGODB_URI);
  const dbName = `${mongoose.connection.db!.databaseName}_e2e`;
  await mongoose.disconnect();
  await mongoose.connect(env.MONGODB_URI, { dbName });
  assert.ok(mongoose.connection.db!.databaseName.endsWith("_e2e"), "refusing to drop a non-test db");
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), RefreshToken.init(), Movie.init()]); // unique indexes must exist

  const server = app.listen(0);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;

  const call = async (method: string, path: string, cookie = "", body?: unknown): Promise<Res> => {
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
      body: JSON.stringify({ email: `${role}@e2e.test`, password: "password123", fullName: role, role }),
    });
    assert.equal(res.status, 201, `register ${role}`);
    return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  };

  let passed = 0;
  const check = async (name: string, fn: () => Promise<void>) => {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  };

  try {
    const he = await register("jyotsan");
    const she = await register("dipika");
    const add = (who: string, movie: unknown) => call("POST", "/movies", who, { movie });

    console.log("accounts");
    await check("a role can only be registered once", async () => {
      const r = await call("POST", "/auth/register", "", {
        email: "third@e2e.test", password: "password123", fullName: "x", role: "dipika",
      });
      assert.equal(r.status, 409);
      assert.equal(r.body.error, "This role is already taken.");
    });
    await check("movie routes need login", async () => {
      assert.equal((await call("GET", "/movies")).status, 401);
    });

    console.log("adding");
    let titanic = "";
    await check("adds to the OTHER person's column, normalised", async () => {
      const r = await add(he, "  Titanic-1997 ");
      assert.equal(r.status, 201);
      assert.equal(r.body.data.movie.forRole, "dipika");
      assert.equal(r.body.data.movie.title, "Titanic");
      assert.equal(r.body.data.movie.year, 1997);
      assert.equal(r.body.data.movie.watchedAt, null);
      assert.equal(r.body.data.movie.editedAt, null);
      titanic = r.body.data.movie.id;
    });
    await check("client can't pick the column (forRole is ignored)", async () => {
      const r = await call("POST", "/movies", he, { movie: "Heat - 1995", forRole: "jyotsan" });
      assert.equal(r.status, 201);
      assert.equal(r.body.data.movie.forRole, "dipika");
    });
    await check("duplicate in the same column is rejected, ignoring case", async () => {
      const r = await add(he, "titanic - 1997");
      assert.equal(r.status, 409);
      assert.equal(r.body.error, "Already in their list.");
    });
    await check("same movie is fine in the other column", async () => {
      assert.equal((await add(she, "Titanic - 1997")).status, 201);
    });
    await check("same name, different year is a different movie", async () => {
      assert.equal((await add(he, "Titanic - 1953")).status, 201);
    });
    await check("dash inside the name: last dash is the year separator", async () => {
      const r = await add(he, "Spider-Man - 2002");
      assert.equal(r.body.data.movie.title, "Spider-Man");
    });
    await check("en dash from phone keyboards is accepted", async () => {
      const r = await add(he, "Inception – 2010");
      assert.equal(r.status, 201);
      assert.equal(r.body.data.movie.title, "Inception");
    });
    await check("bad formats are 422 with a field message", async () => {
      const thisYear = new Date().getFullYear();
      for (const bad of ["Titanic", "Titanic 1997", "- 1997", "--- - 1997", "Titanic - 97",
        "Titanic - 1700", `Titanic - ${thisYear + 2}`, "", "   ", 1997, null, "x".repeat(300) + " - 2000"]) {
        const r = await add(he, bad);
        assert.equal(r.status, 422, `should reject ${JSON.stringify(bad)}`);
        assert.ok(r.body.details?.[0]?.message, `details for ${JSON.stringify(bad)}`);
      }
      assert.equal((await add(he, `Next Year - ${thisYear + 1}`)).status, 201, "next year allowed");
    });
    await check("concurrent duplicate adds: exactly one wins", async () => {
      const results = await Promise.all([add(she, "Up - 2009"), add(she, "up - 2009"), add(she, "UP-2009")]);
      assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409]);
    });

    console.log("listing");
    await check("both columns returned, newest first", async () => {
      const r = await call("GET", "/movies", she);
      assert.equal(r.status, 200);
      const { jyotsan, dipika } = r.body.data.columns;
      assert.ok(Array.isArray(jyotsan) && Array.isArray(dipika));
      assert.ok(dipika.every((m: { forRole: string }) => m.forRole === "dipika"));
      const dates = dipika.map((m: { createdAt: string }) => Date.parse(m.createdAt));
      assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
    });

    console.log("editing");
    await check("only the recommender can edit", async () => {
      const r = await call("PATCH", `/movies/${titanic}`, she, { movie: "Avatar - 2009" });
      assert.equal(r.status, 403);
    });
    let editedAt = "";
    await check("recommender edits: editedAt set, createdAt kept", async () => {
      const before = (await call("GET", "/movies", he)).body.data.columns.dipika
        .find((m: { id: string }) => m.id === titanic);
      const r = await call("PATCH", `/movies/${titanic}`, he, { movie: "Titanic - 1998" });
      assert.equal(r.status, 200);
      assert.equal(r.body.data.movie.year, 1998);
      assert.ok(r.body.data.movie.editedAt);
      assert.equal(r.body.data.movie.createdAt, before.createdAt);
      editedAt = r.body.data.movie.editedAt;
    });
    await check("editing to the exact same text is a no-op (no new editedAt)", async () => {
      const r = await call("PATCH", `/movies/${titanic}`, he, { movie: "Titanic - 1998" });
      assert.equal(r.status, 200);
      assert.equal(r.body.data.movie.editedAt, editedAt);
    });
    await check("case-only fix is allowed (not a duplicate of itself)", async () => {
      const r = await call("PATCH", `/movies/${titanic}`, he, { movie: "TITANIC - 1998" });
      assert.equal(r.status, 200);
      assert.equal(r.body.data.movie.title, "TITANIC");
    });
    await check("editing into another movie in that column is a duplicate", async () => {
      const r = await call("PATCH", `/movies/${titanic}`, he, { movie: "heat - 1995" });
      assert.equal(r.status, 409);
    });
    await check("edit validates the format too", async () => {
      assert.equal((await call("PATCH", `/movies/${titanic}`, he, { movie: "Titanic" })).status, 422);
    });

    console.log("watching");
    let watchedAt = "";
    await check("only the column owner can tick", async () => {
      const r = await call("PATCH", `/movies/${titanic}/watched`, he, { watched: true });
      assert.equal(r.status, 403);
    });
    await check("owner ticks: watchedAt set", async () => {
      const r = await call("PATCH", `/movies/${titanic}/watched`, she, { watched: true });
      assert.equal(r.status, 200);
      assert.ok(r.body.data.movie.watchedAt);
      watchedAt = r.body.data.movie.watchedAt;
    });
    await check("ticking again is idempotent (keeps the first watchedAt)", async () => {
      const r = await call("PATCH", `/movies/${titanic}/watched`, she, { watched: true });
      assert.equal(r.status, 200);
      assert.equal(r.body.data.movie.watchedAt, watchedAt);
    });
    await check("can't edit once watched", async () => {
      const r = await call("PATCH", `/movies/${titanic}`, he, { movie: "Titanic - 1997" });
      assert.equal(r.status, 409);
      assert.equal(r.body.error, "Already watched, can't edit.");
    });
    await check("watched must be a boolean", async () => {
      assert.equal((await call("PATCH", `/movies/${titanic}/watched`, she, { watched: "yes" })).status, 422);
    });
    await check("untick clears watchedAt and allows editing again", async () => {
      const r = await call("PATCH", `/movies/${titanic}/watched`, she, { watched: false });
      assert.equal(r.body.data.movie.watchedAt, null);
      assert.equal((await call("PATCH", `/movies/${titanic}`, he, { movie: "Titanic - 1997" })).status, 200);
    });

    console.log("deleting");
    await check("only the recommender can delete", async () => {
      assert.equal((await call("DELETE", `/movies/${titanic}`, she)).status, 403);
    });
    await check("recommender can delete even after it was watched", async () => {
      await call("PATCH", `/movies/${titanic}/watched`, she, { watched: true });
      assert.equal((await call("DELETE", `/movies/${titanic}`, he)).status, 200);
    });
    await check("deleted / unknown movie is 404 everywhere", async () => {
      assert.equal((await call("DELETE", `/movies/${titanic}`, he)).status, 404);
      assert.equal((await call("PATCH", `/movies/${titanic}`, he, { movie: "A - 2000" })).status, 404);
      assert.equal((await call("PATCH", `/movies/${titanic}/watched`, she, { watched: true })).status, 404);
    });
    await check("malformed id is 422, not a 500", async () => {
      assert.equal((await call("DELETE", "/movies/not-an-id", he)).status, 422);
    });

    console.log(`\n${passed} checks passed`);
  } finally {
    server.close();
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
