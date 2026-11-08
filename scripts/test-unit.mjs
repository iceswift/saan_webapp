import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const suites = readdirSync(path.join(root, "tests"))
  .filter((name) => name.endsWith(".test.ts") && !name.endsWith(".integration.test.ts"))
  .sort()
  .map((name) => `tests/${name}`);

if (!suites.length) throw new Error("No unit test suites found");

const result = spawnSync(process.execPath, [
  "--conditions=react-server",
  "--import",
  "tsx",
  "--test",
  "--test-concurrency=1",
  ...suites,
], {
  cwd: root,
  env: { ...process.env, NODE_ENV: "test", PAYMENT_PROVIDER: "mock" },
  stdio: "inherit",
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

