import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// The hosting wrapper must supply the ISOLATED database URL; never derive it here.
assert.equal(new URL(process.env.DATABASE_URL ?? "").pathname, "/saan_test");
assert.match(process.env.DATABASE_URL, /^postgres(?:ql)?:/);
const result = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--test",
  "--test-concurrency=1", "tests/payments.integration.test.ts", "tests/settlements.integration.test.ts",
  "tests/runtime-policy.integration.test.ts", "tests/refund-cases.integration.test.ts", "tests/omise-payout.integration.test.ts"], { stdio: "inherit", env: {
  ...process.env, NODE_ENV: "test", APP_ENV: "test", PAYMENT_PROVIDER: "mock", PAYMENT_MUTATIONS_DISABLED: "false",
} });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
