import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { type TestContext } from "node:test";
import { db } from "../src/server/db";
import { consumeOtp } from "../src/server/otp-service";

assert.match(process.env.DATABASE_URL ?? "", /money-test\.db$/);
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
