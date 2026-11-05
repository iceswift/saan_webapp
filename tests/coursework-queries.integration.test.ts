import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { type TestContext } from "node:test";
import { db } from "../src/server/db";
import { getOrder, getProduct, listMyOrders, listProducts } from "../src/server/queries";
import type { CurrentUser } from "../src/server/auth";

const database = process.env.DATABASE_URL ?? "";
assert.ok(/^postgres/.test(database)
  ? new URL(database).pathname === "/saan_test"
  : /money-test\.db$/.test(database), "Use an isolated test database");

async function fixture(t: TestContext) {
  const prefix = `course-${randomUUID()}`;
  const users = await Promise.all(["buyer", "shop", "outsider", "other-shop", "admin"].map(async (kind) =>
    db.user.create({ data: { phone: `${prefix}-${kind}`, name: kind,
      role: kind === "admin" ? "ADMIN" : kind.includes("shop") ? "PROVIDER" : "CUSTOMER" } })));
  const [buyer, owner, outsider, otherOwner, admin] = users;
  const provider = await db.provider.create({ data: { userId: owner.id, name: prefix,
    kind: "SHOP", status: "VERIFIED", areas: '["BKK"]', phone: "0800000000" } });
  const otherProvider = await db.provider.create({ data: { userId: otherOwner.id, name: `${prefix}-pending`,
    kind: "SHOP", status: "PENDING", areas: '["NBI"]', phone: "0800000000" } });
  const product = await db.product.create({ data: { providerId: provider.id, name: `${prefix}-active`,
    kind: "MODERN", price: 1000 } });
  const hidden = await db.product.create({ data: { providerId: provider.id, name: `${prefix}-inactive`,
    kind: "MODERN", price: 500, active: false } });
  const pending = await db.product.create({ data: { providerId: otherProvider.id, name: `${prefix}-unverified`,
    kind: "MODERN", price: 200 } });
  t.after(async () => {
    await db.order.deleteMany({ where: { code: { startsWith: prefix } } });
    await db.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
  });
  const viewer = (user: typeof buyer): CurrentUser => ({ id: user.id, phone: user.phone,
    name: user.name, role: user.role as CurrentUser["role"] });
  return { prefix, buyer, owner, outsider, otherOwner, admin, provider, otherProvider,
    product, hidden, pending, viewer };
}

test("CQ-01 catalog and detail never expose inactive or unverified products", async (t) => {
  const f = await fixture(t);
  assert.deepEqual((await listProducts({ q: f.prefix })).map(p => p.id), [f.product.id]);
  assert.ok(await getProduct(f.product.id));
  assert.equal(await getProduct(f.hidden.id), null);
  assert.equal(await getProduct(f.pending.id), null);
  await db.provider.update({ where: { id: f.provider.id }, data: { status: "REJECTED" } });
  assert.deepEqual(await listProducts({ q: f.prefix }), []);
  assert.equal(await getProduct(f.product.id), null);
});

test("CQ-02 catalog boundaries and package projection preserve shop eligibility", async (t) => {
  const f = await fixture(t);
  const active = await db.servicePackage.create({ data: { providerId: f.provider.id,
    type: "BASE", name: "Synthetic active base", price: 100 } });
  await db.servicePackage.create({ data: { providerId: f.provider.id,
    type: "BASE", name: "Synthetic inactive base", price: 200, active: false } });
  await db.servicePackage.create({ data: { providerId: f.otherProvider.id,
    type: "BASE", name: "Synthetic other base", price: 50 } });
  assert.equal((await listProducts({ q: f.prefix, area: "BKK", maxPrice: 1000 })).length, 1);
  assert.deepEqual(await listProducts({ q: f.prefix, area: "NBI", maxPrice: 1000 }), []);
  assert.deepEqual(await listProducts({ q: f.prefix, maxPrice: 999 }), []);
  assert.deepEqual((await getProduct(f.product.id))?.packages.map(p => p.id), [active.id]);
});

test("CQ-03 saved order retrieval preserves price snapshots and customer ownership", async (t) => {
  const f = await fixture(t);
  const order = await db.order.create({ data: { code: `${f.prefix}-saved`, userId: f.buyer.id,
    providerId: f.provider.id, type: "INSTALL", area: "BKK", address: "SYNTHETIC PRIVATE ADDRESS",
    total: 1000, deposit: 300, items: { create: { productId: f.product.id, name: "Original item", price: 1000 } } } });
  await db.product.update({ where: { id: f.product.id }, data: { price: 2500, name: "Changed catalog item" } });
  const saved = await getOrder(order.id, f.viewer(f.buyer));
  assert.equal(saved?.total, 1000);
  assert.equal(saved?.deposit, 300);
  assert.equal(saved?.items[0].price, 1000);
  assert.equal(saved?.items[0].name, "Original item");
  assert.equal(saved?.status, "AWAITING_DEPOSIT");
  assert.ok((await listMyOrders(f.buyer.id)).some(row => row.id === order.id));
  assert.equal((await listMyOrders(f.outsider.id)).some(row => row.id === order.id), false);
});

test("CQ-04 private order projection denies unrelated buyers and providers", async (t) => {
  const f = await fixture(t);
  const order = await db.order.create({ data: { code: `${f.prefix}-private`, userId: f.buyer.id,
    providerId: f.provider.id, type: "INSTALL", area: "BKK", address: "SYNTHETIC PRIVATE ADDRESS",
    note: "SYNTHETIC PRIVATE NOTE", total: 1000, deposit: 300 } });
  for (const user of [f.outsider, f.otherOwner]) assert.equal(await getOrder(order.id, f.viewer(user)), null);
  for (const [user, role] of [[f.buyer, "CUSTOMER"], [f.owner, "PROVIDER"], [f.admin, "ADMIN"]] as const) {
    const permitted = await getOrder(order.id, f.viewer(user));
    assert.equal(permitted?.viewerIs, role);
    assert.equal(permitted?.address, "SYNTHETIC PRIVATE ADDRESS");
  }
  assert.equal(await getOrder(`missing-${f.prefix}`, f.viewer(f.buyer)), null);
});

test.after(() => db.$disconnect());
