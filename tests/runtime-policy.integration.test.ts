import assert from "node:assert/strict";
import test from "node:test";
import { canUseTestLogin, isStagingTestMode, shouldUseMockPayments } from "../src/server/runtime-policy";

test("production never enables test login or simulated payments", () => {
  for (const env of [
    { NODE_ENV: "production", STAGING_TEST_MODE: "true", PAYMENT_PROVIDER: "mock" },
    { NODE_ENV: "production", APP_ENV: "production", STAGING_TEST_MODE: "true", PAYMENT_PROVIDER: "mock", STAGING_TEST_PHONES: "0800000002" },
  ]) {
    assert.equal(canUseTestLogin("0800000002", env), false);
    assert.equal(shouldUseMockPayments(env), false);
  }
});

test("staging requires explicit switch, valid allowlist and selected mock gateway", () => {
  const env = { NODE_ENV: "production", APP_ENV: "staging", STAGING_TEST_MODE: "true", STAGING_TEST_PHONES: "0800000002", PAYMENT_PROVIDER: "mock" };
  assert.equal(isStagingTestMode(env), true);
  assert.equal(canUseTestLogin("0800000002", env), true);
  assert.equal(canUseTestLogin("0800000009", env), false);
  assert.equal(shouldUseMockPayments(env), true);
  for (const patch of [{ STAGING_TEST_MODE: "false" }, { STAGING_TEST_PHONES: "" }, { STAGING_TEST_PHONES: "invalid" }]) {
    assert.equal(canUseTestLogin("0800000002", { ...env, ...patch }), false);
    assert.equal(shouldUseMockPayments({ ...env, ...patch }), false);
  }
  assert.equal(shouldUseMockPayments({ ...env, PAYMENT_PROVIDER: "unconfigured" }), false);
});
