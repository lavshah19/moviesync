/**
 * One-off migration: email + fullName -> username.
 *   - every user without a username gets one from fullName (else the email's local part, else
 *     the role), normalised like the validator does
 *   - email and fullName are removed from the documents
 *   - the old unique `email_1` index is dropped (left in place, every new user without an email
 *     would count as email: null and the 2nd registration would fail as a duplicate)
 *   - the unique `username_1` index is created
 *
 *   npx tsx scripts/migrate-username.ts            dry run: prints the plan, changes nothing
 *   npx tsx scripts/migrate-username.ts --apply    does it (idempotent: safe to run twice)
 */
process.env.LOG_LEVEL = "silent";

async function main() {
  const apply = process.argv.includes("--apply");
  const { default: mongoose } = await import("mongoose");
  const { env } = await import("../src/config/env.js");
  const { normalizeUsername } = await import("../src/modules/auth/validator/auth.validator.js");

  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db!;
  const users = db.collection("users");
  console.log(`${apply ? "APPLY" : "DRY RUN"} on database "${db.databaseName}"`);

  const pending = await users.find({ username: { $exists: false } }).toArray();
  const plan = pending.map((u) => ({
    _id: u._id,
    role: u.role as string,
    username: normalizeUsername(
      (u.fullName as string | null) || String(u.email ?? "").split("@")[0] || (u.role as string),
    ),
  }));
  const taken = new Set((await users.find({ username: { $exists: true } }).toArray()).map((u) => String(u.username)));
  for (const p of plan) {
    if (taken.has(p.username)) throw new Error(`username "${p.username}" would collide; set it by hand`);
    taken.add(p.username);
    console.log(`  ${p.role}: username = "${p.username}"`);
  }
  if (plan.length === 0) console.log("  no users to migrate");

  const indexes = (await users.indexes()).map((i) => i.name);
  console.log(`  indexes now: ${indexes.join(", ")}`);

  if (apply) {
    for (const p of plan) {
      await users.updateOne({ _id: p._id }, { $set: { username: p.username }, $unset: { email: "", fullName: "" } });
    }
    // users that already had a username but still carry the old fields
    await users.updateMany({ $or: [{ email: { $exists: true } }, { fullName: { $exists: true } }] }, { $unset: { email: "", fullName: "" } });
    if (indexes.includes("email_1")) await users.dropIndex("email_1");
    await users.createIndex({ username: 1 }, { unique: true, name: "username_1" });
    console.log(`  done. indexes now: ${(await users.indexes()).map((i) => i.name).join(", ")}`);
  } else {
    console.log("  nothing changed (run with --apply)");
  }
  await mongoose.disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
