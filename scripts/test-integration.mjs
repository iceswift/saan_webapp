import { spawnSync } from "node:child_process";
import { closeSync, mkdirSync, openSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.join(root, "storage", "tests", "ci");
mkdirSync(directory, { recursive: true });
// Prisma's SQLite engine needs an existing file on some Windows installations.
closeSync(openSync(path.join(directory, "money-test.db"), "a"));
// Always override inherited configuration: integration tests must never touch app data.
const env = {
  ...process.env,
  DATABASE_URL: `file:${path.join(directory, "money-test.db").replaceAll("\\", "/")}`,
  PAYMENT_PROVIDER: "mock",
  NODE_ENV: "test",
};
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"]);
const suites = readdirSync(path.join(root, "tests"))
  .filter((name) => name.endsWith(".integration.test.ts"))
  .sort()
  .map((name) => `tests/${name}`);
if (!suites.length) throw new Error("No integration suites found");
run(["--conditions=react-server", "--import", "tsx", "--test", "--test-concurrency=1", ...suites]);
