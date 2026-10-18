import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

// This suite writes fixtures. Require a dedicated, explicitly named test database.
const url = new URL(process.env.DATABASE_URL ?? "");
assert.ok(["postgresql:", "postgres:"].includes(url.protocol));
assert.equal(url.pathname, "/saan_test", "Use a dedicated saan_test database");
const db = new PrismaClient();
const seed = randomUUID();
let customer;
let shop;
let provider;
let order;
try {
  const version = await db.$queryRaw`SELECT version()`;
  assert.match(version[0].version, /PostgreSQL/);
  customer = await db.user.create({ data: { phone: `pg-customer-${seed}`, name: "ทดสอบ PostgreSQL" } });
  shop = await db.user.create({ data: { phone: `pg-shop-${seed}` } });
  provider = await db.provider.create({ data: {
    userId: shop.id, name: "ร้านทดสอบ", kind: "SHOP", phone: "0800000000", areas: '["BKK"]', status: "VERIFIED",
  } });
  order = await db.order.create({ data: {
    code: `PG-${seed}`, userId: customer.id, providerId: provider.id,
    type: "INSTALL", area: "BKK", address: "ที่อยู่ทดสอบ", total: 1000, deposit: 300,
  } });
  const input = {
    key: `${order.id}:DEPOSIT`, orderId: order.id, kind: "PAYMENT_DEPOSIT",
    amountMinor: 30000, requestedBy: customer.id,
  };
  // Database uniqueness is the final barrier against duplicate money requests.
  const attempts = await Promise.allSettled([
    db.moneyOperation.create({ data: input }), db.moneyOperation.create({ data: input }),
  ]);
  assert.equal(attempts.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(attempts.filter((result) => result.status === "rejected" && result.reason.code === "P2002").length, 1);
  await assert.rejects(db.order.delete({ where: { id: order.id } }), { code: "P2003" });
  // An interrupted transaction must persist neither its payment nor its status change.
  await assert.rejects(db.$transaction(async (tx) => {
    await tx.payment.create({ data: {
      orderId: order.id, kind: "DEPOSIT", amount: 300, method: "PROMPTPAY", gateway: "mock", status: "PAID",
    } });
    await tx.order.update({ where: { id: order.id }, data: { status: "AWAITING_PROVIDER" } });
    throw new Error("Injected rollback");
  }), /Injected rollback/);
  assert.equal(await db.payment.count({ where: { orderId: order.id } }), 0);
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status, "AWAITING_DEPOSIT");
  console.log("PostgreSQL checks passed: connection, relations, unique money keys, deletion protection, transaction rollback");
} finally {
  if (order) {
    await db.moneyOperation.deleteMany({ where: { orderId: order.id } });
    await db.order.delete({ where: { id: order.id } });
  }
  if (provider) await db.provider.delete({ where: { id: provider.id } });
  if (customer) await db.user.delete({ where: { id: customer.id } });
  if (shop) await db.user.delete({ where: { id: shop.id } });
  await db.$disconnect();
}
