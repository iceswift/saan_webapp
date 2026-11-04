import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Caller supplies the explicit isolated URL. Never derive a writable test URL here.
let database;
try { database = new URL(process.env.DATABASE_URL ?? ""); } catch { throw new Error("Supply the isolated saan_test database URL"); }
if (!["postgresql:", "postgres:"].includes(database.protocol) || database.pathname !== "/saan_test") throw new Error("Refusing tests outside the isolated saan_test database");
const temporary = mkdtempSync(path.join(tmpdir(), "saan-postgres-qa-"));
const env = { ...process.env, NODE_ENV: "test", APP_ENV: "test", PAYMENT_PROVIDER: "mock", PAYMENT_MUTATIONS_DISABLED: "false", UPLOAD_DIR: path.join(temporary, "uploads"), OPERATIONS_DIR: path.join(temporary, "operations") };
for (const key of Object.keys(env)) if (/OMISE|SECRET/.test(key)) delete env[key];
const redact = text => (text ?? "").replace(/postgres(?:ql)?:\/\/[^\s'"<>]+/g, "[REDACTED_DATABASE_URL]");
function run(args) {
  const result = spawnSync(process.execPath, args, { env, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  process.stdout.write(redact(result.stdout));
  process.stderr.write(redact(result.stderr));
  if (result.error) throw new Error("Unable to start isolated test process");
  if (result.status !== 0) process.exit(result.status || 1);
}
run(["node_modules/prisma/build/index.js", "migrate", "deploy", "--schema", "prisma/postgresql/schema.prisma"]);
run(["scripts/test-postgres.mjs"]);
const sqliteOnly = new Set(["provider-orders.integration.test.ts", "reviews.integration.test.ts"]);
const suites = readdirSync("tests").filter(name => name.endsWith(".integration.test.ts") && !sqliteOnly.has(name)).sort().map(name => `tests/${name}`);
run(["--conditions=react-server", "--import", "tsx", "--test", "--test-concurrency=1", ...suites]);
