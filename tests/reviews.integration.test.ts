import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { type TestContext } from "node:test";
import { db } from "../src/server/db";
import { createOrderReview } from "../src/server/review-service";

assert.match(process.env.DATABASE_URL ?? "", /money-test\.db(?:\?.*)?$/);

async function fixture(t: TestContext, status = "COMPLETED") {
  const seed = randomUUID();
  const customer = await db.user.create({ data: { phone: `review-customer-${seed}` } });
  const shopUser = await db.user.create({ data: { phone: `review-shop-${seed}` } });
  const provider = await db.provider.create({ data: { userId: shopUser.id, name: "ร้านทดสอบรีวิว", kind: "SHOP", phone: "0800000000", areas: '["BKK"]', status: "VERIFIED" } });
  const order = await db.order.create({ data: {
    code: `REVIEW-${seed}`, userId: customer.id, providerId: provider.id, type: "INSTALL", status,
    area: "BKK", address: "ที่อยู่ทดสอบ", total: 1000, deposit: 300,
  } });
  t.after(async () => {
    await db.order.delete({ where: { id: order.id } });
    await db.provider.delete({ where: { id: provider.id } });
    await db.user.deleteMany({ where: { id: { in: [customer.id, shopUser.id] } } });
  });
  return { order, customer, shopUser, input: { orderId: order.id, userId: customer.id, rating: 5, comment: "งานเรียบร้อย" } };
}

test("concurrent review submissions create one review and one notification", async (t) => {
  const f = await fixture(t);
  const results = await Promise.all([createOrderReview(f.input), createOrderReview(f.input)]);
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(results.filter((result) => !result.ok).length, 1);
  assert.equal(await db.review.count({ where: { orderId: f.order.id } }), 1);
  assert.equal(await db.notification.count({ where: { userId: f.shopUser.id } }), 1);
  const repeated = await createOrderReview(f.input);
  assert.deepEqual(repeated, { ok: false, error: "คุณรีวิวคำสั่งนี้แล้ว" });
});

test("another user cannot review an order", async (t) => {
  const f = await fixture(t);
  assert.equal((await createOrderReview({ ...f.input, userId: f.shopUser.id })).ok, false);
  assert.equal(await db.review.count({ where: { orderId: f.order.id } }), 0);
  assert.equal(await db.notification.count({ where: { userId: f.shopUser.id } }), 0);
});

test("reviews require completed customer acceptance", async (t) => {
  const f = await fixture(t, "DONE");
  assert.deepEqual(await createOrderReview(f.input), { ok: false, error: "รีวิวได้หลังตรวจรับงานแล้ว" });
  assert.equal(await db.review.count({ where: { orderId: f.order.id } }), 0);
});

test("notification insertion failure rolls back the review and permits retry", async (t) => {
  const f = await fixture(t);
  const trigger = `review_failure_${randomUUID().replaceAll("-", "")}`;
  // Test-only SQLite trigger targets this fixture's recipient and leaves concurrent suites unaffected.
  await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON Notification WHEN NEW.userId = '${f.shopUser.id}' BEGIN SELECT RAISE(ABORT, 'review notification test failure'); END`);
  t.after(async () => { await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger}`); });
  assert.equal((await createOrderReview(f.input)).ok, false);
  assert.equal(await db.review.count({ where: { orderId: f.order.id } }), 0);
  assert.equal(await db.notification.count({ where: { userId: f.shopUser.id } }), 0);
  await db.$executeRawUnsafe(`DROP TRIGGER ${trigger}`);
  assert.equal((await createOrderReview(f.input)).ok, true);
  assert.equal(await db.review.count({ where: { orderId: f.order.id } }), 1);
  assert.equal(await db.notification.count({ where: { userId: f.shopUser.id } }), 1);
});
