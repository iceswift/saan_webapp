import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { type TestContext } from "node:test";
import { db } from "../src/server/db";
import { cancelCustomerOrder } from "../src/server/payment-service";
import { confirmProviderOrder } from "../src/server/provider-order-service";

assert.match(process.env.DATABASE_URL ?? "", /money-test\.db(?:\?.*)?$/);
const appointment = new Date("2030-01-02T00:30:00+07:00");

async function fixture(t: TestContext) {
  const seed = randomUUID();
  const customer = await db.user.create({ data: { phone: `calendar-customer-${seed}` } });
  const owner = await db.user.create({ data: { phone: `calendar-owner-${seed}` } });
  const provider = await db.provider.create({ data: {
    userId: owner.id, name: "ร้านทดสอบปฏิทิน", kind: "SHOP", status: "VERIFIED", areas: '["BKK"]', phone: "0800000000",
  } });
  const order = await db.order.create({ data: {
    code: `CALENDAR-${seed}`, userId: customer.id, providerId: provider.id, type: "INSTALL", status: "AWAITING_PROVIDER",
    total: 1000, deposit: 300, area: "BKK", address: "ที่อยู่ทดสอบ",
    payments: { create: { kind: "DEPOSIT", amount: 300, status: "PAID", method: "PROMPTPAY", gateway: "legacy" } },
  } });
  t.after(async () => {
    await db.order.delete({ where: { id: order.id } });
    await db.provider.delete({ where: { id: provider.id } });
    await db.user.deleteMany({ where: { id: { in: [customer.id, owner.id] } } });
  });
  return { customer, owner, provider, order, input: { orderId: order.id, userId: owner.id, scheduledAt: appointment } };
}

test("blocked Bangkok date rejects confirmation and rolls back every mutation", async (t) => {
  const f = await fixture(t);
  // 00:30 Bangkok is still the previous UTC calendar day.
  assert.equal(appointment.toISOString().slice(0, 10), "2030-01-01");
  await db.providerBlockedDate.create({ data: { providerId: f.provider.id, date: "2030-01-02" } });
  const result = await confirmProviderOrder(f.input);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /ร้านไม่ว่าง/);
  const unchanged = await db.order.findUniqueOrThrow({ where: { id: f.order.id } });
  assert.equal(unchanged.status, "AWAITING_PROVIDER");
  assert.equal(unchanged.scheduledAt, null);
  assert.equal(unchanged.updatedAt.getTime(), f.order.updatedAt.getTime());
  assert.equal(await db.orderEvent.count({ where: { orderId: f.order.id } }), 0);
  assert.equal(await db.notification.count({ where: { userId: f.customer.id } }), 0);
});

test("an open date confirms once and emits one event and notification", async (t) => {
  const f = await fixture(t);
  assert.equal((await confirmProviderOrder(f.input)).ok, true);
  assert.equal((await confirmProviderOrder(f.input)).ok, false);
  const confirmed = await db.order.findUniqueOrThrow({ where: { id: f.order.id } });
  assert.equal(confirmed.status, "CONFIRMED");
  assert.equal(confirmed.scheduledAt?.getTime(), appointment.getTime());
  assert.equal(await db.orderEvent.count({ where: { orderId: f.order.id, title: "ร้านยืนยันคำสั่ง" } }), 1);
  assert.equal(await db.notification.count({ where: { userId: f.customer.id } }), 1);
});

test("closing a date leaves an already confirmed appointment intact", async (t) => {
  const f = await fixture(t);
  assert.equal((await confirmProviderOrder(f.input)).ok, true);
  await db.providerBlockedDate.create({ data: { providerId: f.provider.id, date: "2030-01-02" } });
  assert.equal((await confirmProviderOrder(f.input)).ok, false);
  const confirmed = await db.order.findUniqueOrThrow({ where: { id: f.order.id } });
  assert.equal(confirmed.status, "CONFIRMED");
  assert.equal(confirmed.scheduledAt?.getTime(), appointment.getTime());
});

test("another user and an unverified owner cannot confirm", async (t) => {
  const f = await fixture(t);
  assert.equal((await confirmProviderOrder({ ...f.input, userId: f.customer.id })).ok, false);
  await db.provider.update({ where: { id: f.provider.id }, data: { status: "PENDING" } });
  assert.equal((await confirmProviderOrder(f.input)).ok, false);
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: f.order.id } })).status, "AWAITING_PROVIDER");
  assert.equal(await db.orderEvent.count({ where: { orderId: f.order.id } }), 0);
});

test("concurrent confirmation and cancellation produce one terminal transition", async (t) => {
  const f = await fixture(t);
  const results = await Promise.all([
    confirmProviderOrder(f.input),
    cancelCustomerOrder(f.order.id, f.customer.id),
  ]);
  assert.equal(results.filter((result) => result.ok).length, 1);
  const order = await db.order.findUniqueOrThrow({ where: { id: f.order.id } });
  assert.ok(order.status === "CONFIRMED" || order.status === "CANCELLED");
  assert.equal(await db.orderEvent.count({ where: { orderId: f.order.id } }), 1);
});

test("past and invalid appointments cannot mutate the order", async (t) => {
  const f = await fixture(t);
  assert.equal((await confirmProviderOrder({ ...f.input, scheduledAt: new Date(0) })).ok, false);
  assert.equal((await confirmProviderOrder({ ...f.input, scheduledAt: new Date("invalid") })).ok, false);
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: f.order.id } })).status, "AWAITING_PROVIDER");
});

test.after(async () => { await db.$disconnect(); });
