import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { type TestContext } from "node:test";
import { db } from "../src/server/db";
import { consumeOtp } from "../src/server/otp-service";

const database = process.env.DATABASE_URL ?? "";
assert.ok(/^postgres/.test(database) ? new URL(database).pathname === "/saan_test" : /money-test\.db$/.test(database), "Use an isolated test database");
async function fixture(t: TestContext, expiresAt = new Date(Date.now() + 60000)) {
  const phone = `otp-test-${randomUUID()}`;
  await db.otpCode.create({ data: { phone, code: "123456", expiresAt } });
  t.after(async () => { await db.otpCode.deleteMany({ where: { phone } }); });
  return phone;
}
test("concurrent OTP redemption succeeds exactly once and cannot be replayed", async (t) => {
  const phone = await fixture(t);
  const results = await Promise.all([consumeOtp(phone, "123456"), consumeOtp(phone, "123456")]);
  assert.equal(results.filter((r) => r.ok).length, 1);
  assert.equal((await consumeOtp(phone, "123456")).ok, false);
});
test("expired OTP and locked OTP cannot be redeemed", async (t) => {
  const expired = await fixture(t, new Date(Date.now() - 1000));
  assert.equal((await consumeOtp(expired, "123456")).ok, false);
  const phone = await fixture(t);
  for (let i = 0; i < 5; i++) assert.equal((await consumeOtp(phone, "000000")).ok, false);
  assert.equal((await consumeOtp(phone, "123456")).ok, false);
  assert.equal((await db.otpCode.findFirstOrThrow({ where: { phone } })).attempts, 5);
});
test.after(async () => { await db.$disconnect(); });

test("resending never resurrects an older code after the newest challenge is consumed, expired or locked", async (t) => {
  for (const state of ["consumed", "expired", "locked"] as const) {
    const phone = await fixture(t, new Date(Date.now() + 120000));
    await db.otpCode.updateMany({ where: { phone }, data: { createdAt: new Date(Date.now() - 10000) } });
    await db.otpCode.create({ data: { phone, code: "654321", createdAt: new Date(), expiresAt: new Date(Date.now() + (state === "expired" ? -1000 : 60000)), attempts: state === "locked" ? 5 : 0 } });
    if (state === "consumed") assert.equal((await consumeOtp(phone, "654321")).ok, true);
    assert.equal((await consumeOtp(phone, "123456")).ok, false);
    assert.equal((await consumeOtp(phone, "654321")).ok, false);
    const older = await db.otpCode.findFirstOrThrow({ where: { phone, code: "123456" } });
    assert.equal(older.consumedAt, null);
  }
});
