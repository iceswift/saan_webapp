import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test, { type TestContext } from "node:test";
import { db } from "../src/server/db";
import { cancelCustomerOrder, checkCustomerPayment, reconcileCustomerPaymentOperation, runCustomerPayment } from "../src/server/payment-service";
import type { PaymentGateway, GatewayRequest, GatewayResult } from "../src/server/payment-gateway";
import { reconcileOmiseBatch, storeOmiseEvent } from "../src/server/omise-webhook-inbox";

// This suite must never run against the application database.
const testDatabaseUrl = process.env.DATABASE_URL ?? "";
const postgres = /^postgres(?:ql)?:/.test(testDatabaseUrl);
if (postgres) assert.equal(new URL(testDatabaseUrl).pathname, "/saan_test");
else assert.match(testDatabaseUrl, /money-test\.db(?:\?.*)?$/);

async function fixture(t: TestContext, status = "AWAITING_DEPOSIT", paid = 0) {
  const seed = randomUUID();
  const customer = await db.user.create({ data: { phone: `test-customer-${seed}`, name: "ทดสอบ" } });
  const shopUser = await db.user.create({ data: { phone: `test-shop-${seed}` } });
  const provider = await db.provider.create({ data: { userId: shopUser.id, name: "ร้านทดสอบ", kind: "SHOP", phone: "0800000000", areas: '["BKK"]', status: "VERIFIED" } });
  const order = await db.order.create({
    data: {
      code: `TEST-${seed}`, userId: customer.id, providerId: provider.id, type: "INSTALL", status,
      area: "BKK", address: "ที่อยู่สำหรับทดสอบ", total: 1000, deposit: 300,
      lat: 13.75, lng: 100.5, items: { create: { name: "ศาลทดสอบ", price: 1000 } },
      ...(paid ? { payments: { create: { kind: "DEPOSIT", amount: paid, method: "PROMPTPAY", status: "PAID", gateway: "legacy", gatewayRef: seed } } } : {}),
    },
  });
  t.after(async () => {
    await db.moneyOperation.deleteMany({ where: { orderId: order.id } });
    await db.order.delete({ where: { id: order.id } });
    await db.provider.delete({ where: { id: provider.id } });
    await db.user.deleteMany({ where: { id: { in: [customer.id, shopUser.id] } } });
  });
  return { order, customer, provider, input: { orderId: order.id, userId: customer.id, method: "PROMPTPAY" as const, kind: "PAYMENT_DEPOSIT" as const } };
}

function gateway(execute: (input: GatewayRequest) => Promise<GatewayResult>, retrieve?: PaymentGateway["retrieve"]): PaymentGateway {
  return { name: "integration-test", execute, retrieve: retrieve ?? (async () => ({ status: "UNKNOWN", reference: "" })) };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

test("a paid then cancelled order cannot report a new successful payment",async(t)=>{
  const f=await fixture(t);
  let calls=0;
  const adapter=gateway(async()=>{calls++;return {status:"SUCCEEDED",reference:"paid-before-cancel"};});
  assert.equal((await runCustomerPayment(f.input,adapter)).ok,true);
  assert.equal((await cancelCustomerOrder(f.order.id,f.customer.id)).ok,true);
  assert.equal((await runCustomerPayment(f.input,adapter)).ok,false);
  assert.equal(calls,1);
});

test("negative stale retrieval cannot release cancellation while submission is in flight",async(t)=>{
  const f=await fixture(t);
  const began=deferred<void>();
  const release=deferred<GatewayResult>();
  const adapter=gateway(async()=>{began.resolve();return release.promise;},async()=>({status:"FAILED",reference:""}));
  const submitting=runCustomerPayment(f.input,adapter);
  await began.promise;
  const op=await db.moneyOperation.findFirstOrThrow({where:{orderId:f.order.id}});
  await db.moneyOperation.update({where:{id:op.id},data:{updatedAt:new Date(Date.now()-61_000)}});
  assert.equal((await reconcileCustomerPaymentOperation(op.id,adapter)).ok,false);
  assert.equal((await cancelCustomerOrder(f.order.id,f.customer.id)).ok,false);
  release.resolve({status:"SUCCEEDED",reference:"late-success"});
  assert.equal((await submitting).ok,true);
  assert.equal(await db.payment.count({where:{orderId:f.order.id,status:"PAID"}}),1);
});

test("concurrent duplicate deposits execute once and finalize once", async (t) => {
  const f = await fixture(t);
  const began = deferred<void>();
  const release = deferred<GatewayResult>();
  let calls = 0;
  const adapter = gateway(async (input) => {
    calls += 1;
    assert.equal(input.amountMinor, 30_000);
    assert.equal(input.idempotencyKey, `${f.order.id}:DEPOSIT`);
    began.resolve();
    return release.promise;
  });
  const first = runCustomerPayment(f.input, adapter);
  await began.promise;
  const duplicate = await runCustomerPayment(f.input, adapter);
  assert.equal(duplicate.ok, false);
  release.resolve({ status: "SUCCEEDED", reference: "deposit-once" });
  assert.equal((await first).ok, true);
  assert.equal((await runCustomerPayment(f.input, adapter)).ok, true);
  assert.equal(calls, 1);
  assert.equal(await db.payment.count({ where: { orderId: f.order.id } }), 1);
  assert.equal(await db.orderEvent.count({ where: { orderId: f.order.id, title: "จ่ายมัดจำแล้ว" } }), 1);
  assert.equal(await db.moneyOperation.count({ where: { orderId: f.order.id, status: "SUCCEEDED" } }), 1);
});

test("cancellation cannot pass a reserved in-flight deposit", async (t) => {
  const f = await fixture(t);
  const began = deferred<void>();
  const release = deferred<GatewayResult>();
  const first = runCustomerPayment(f.input, gateway(async () => { began.resolve(); return release.promise; }));
  await began.promise;
  assert.equal((await cancelCustomerOrder(f.order.id, f.customer.id)).ok, false);
  release.resolve({ status: "SUCCEEDED", reference: "pay-wins" });
  assert.equal((await first).ok, true);
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: f.order.id } })).status, "AWAITING_PROVIDER");
});

test("cancellation first prevents all subsequent charges", async (t) => {
  const f = await fixture(t);
  let calls = 0;
  assert.equal((await cancelCustomerOrder(f.order.id, f.customer.id)).ok, true);
  assert.equal((await cancelCustomerOrder(f.order.id, f.customer.id)).ok, true);
  assert.equal((await runCustomerPayment(f.input, gateway(async () => { calls++; return { status: "SUCCEEDED", reference: "never" }; }))).ok, false);
  assert.equal(calls, 0);
  assert.equal(await db.orderEvent.count({ where: { orderId: f.order.id } }), 1);
});

test("balance completion creates one payment and one shrine with coordinates", async (t) => {
  const f = await fixture(t, "DONE", 300);
  let calls = 0;
  const adapter = gateway(async (input) => { calls++; assert.equal(input.amountMinor, 70_000); return { status: "SUCCEEDED", reference: "balance-once" }; });
  const input = { ...f.input, kind: "PAYMENT_BALANCE" as const };
  const results = await Promise.all([runCustomerPayment(input, adapter), runCustomerPayment(input, adapter)]);
  assert.ok(results.some((result) => result.ok));
  assert.equal((await runCustomerPayment(input, adapter)).ok, true);
  assert.equal(calls, 1);
  assert.equal(await db.payment.count({ where: { orderId: f.order.id, kind: "BALANCE" } }), 1);
  const order = await db.order.findUniqueOrThrow({ where: { id: f.order.id }, include: { shrine: true } });
  assert.equal(order.status, "COMPLETED");
  assert.equal(order.shrine?.lat, 13.75);
  assert.equal(order.shrine?.lng, 100.5);
  assert.equal(await db.shrine.count({ where: { userId: f.customer.id } }), 1);
  assert.equal(await db.orderEvent.count({ where: { orderId: f.order.id, title: "ลูกค้าตรวจรับงานแล้ว" } }), 1);
});

test("legacy fully paid completion is idempotent without gateway call", async (t) => {
  const f = await fixture(t, "DONE", 1000);
  let calls = 0;
  const adapter = gateway(async () => { calls++; return { status: "SUCCEEDED", reference: "never" }; });
  const input = { ...f.input, kind: "PAYMENT_BALANCE" as const };
  assert.equal((await runCustomerPayment(input, adapter)).ok, true);
  assert.equal((await runCustomerPayment(input, adapter)).ok, true);
  assert.equal(calls, 0);
  assert.equal(await db.shrine.count({ where: { userId: f.customer.id } }), 1);
  assert.equal(await db.moneyOperation.count({ where: { orderId: f.order.id } }), 0);
});

test("timeout stays UNKNOWN and reconciliation retrieves without recharging", async (t) => {
  const f = await fixture(t);
  let calls = 0;
  let retrievals = 0;
  const adapter = gateway(async () => { calls++; throw new Error("network timeout"); }, async () => { retrievals++; return { status: "SUCCEEDED", reference: "reconciled" }; });
  assert.equal((await runCustomerPayment(f.input, adapter)).ok, false);
  const operation = await db.moneyOperation.findUniqueOrThrow({ where: { key: `${f.order.id}:DEPOSIT` } });
  assert.equal(operation.status, "UNKNOWN");
  assert.equal((await runCustomerPayment(f.input, adapter)).ok, false);
  assert.equal((await cancelCustomerOrder(f.order.id, f.customer.id)).ok, false);
  assert.equal(calls, 1);
  assert.equal((await reconcileCustomerPaymentOperation(operation.id, adapter)).ok, true);
  assert.equal((await reconcileCustomerPaymentOperation(operation.id, adapter)).ok, true);
  assert.equal(calls, 1);
  assert.equal(retrievals, 1);
  assert.equal(await db.payment.count({ where: { orderId: f.order.id } }), 1);
});

test("fresh PROCESSING cannot be reconciled while execute is in flight", async (t) => {
  const f = await fixture(t);
  const began = deferred<void>();
  const release = deferred<GatewayResult>();
  let retrievals = 0;
  const adapter = gateway(async () => { began.resolve(); return release.promise; }, async () => { retrievals++; return { status: "SUCCEEDED", reference: "early" }; });
  const first = runCustomerPayment(f.input, adapter);
  await began.promise;
  const operation = await db.moneyOperation.findUniqueOrThrow({ where: { key: `${f.order.id}:DEPOSIT` } });
  assert.equal((await reconcileCustomerPaymentOperation(operation.id, adapter)).ok, false);
  assert.equal(retrievals, 0);
  release.resolve({ status: "SUCCEEDED", reference: "eventual" });
  assert.equal((await first).ok, true);
});

test("FAILED is terminal and permits cancellation without later reconciliation", async (t) => {
  const f = await fixture(t);
  let calls = 0;
  let retrievals = 0;
  const adapter = gateway(async () => { calls++; return { status: "FAILED", reference: "declined" }; }, async () => { retrievals++; return { status: "SUCCEEDED", reference: "never" }; });
  assert.equal((await runCustomerPayment(f.input, adapter)).ok, false);
  assert.equal((await runCustomerPayment(f.input, adapter)).ok, false);
  const operation = await db.moneyOperation.findUniqueOrThrow({ where: { key: `${f.order.id}:DEPOSIT` } });
  assert.equal((await cancelCustomerOrder(f.order.id, f.customer.id)).ok, true);
  assert.equal((await reconcileCustomerPaymentOperation(operation.id, adapter)).ok, false);
  assert.equal(calls, 1);
  assert.equal(retrievals, 0);
});

test("PENDING blocks a new charge and cancellation until retrieval confirms success", async (t) => {
  const f = await fixture(t);
  let calls = 0;
  const adapter = gateway(async () => { calls++; return { status: "PENDING", reference: "pending-capture" }; }, async () => ({ status: "SUCCEEDED", reference: "pending-capture" }));
  assert.equal((await runCustomerPayment(f.input, adapter)).ok, false);
  assert.equal((await runCustomerPayment(f.input, adapter)).ok, false);
  assert.equal((await cancelCustomerOrder(f.order.id, f.customer.id)).ok, false);
  const operation = await db.moneyOperation.findUniqueOrThrow({ where: { key: `${f.order.id}:DEPOSIT` } });
  assert.equal(operation.status, "PENDING");
  assert.equal((await reconcileCustomerPaymentOperation(operation.id, adapter)).ok, true);
  assert.equal(calls, 1);
});

test("stale PROCESSING recovers through retrieval without another execution", async (t) => {
  const f = await fixture(t);
  const operation = await db.moneyOperation.create({ data: {
    orderId: f.order.id, key: `${f.order.id}:DEPOSIT`, kind: "PAYMENT_DEPOSIT", amountMinor: 30_000,
    method: "PROMPTPAY", gateway: "integration-test", requestedBy: f.customer.id,
    status: "PROCESSING", updatedAt: new Date(Date.now() - 120_000),
  } });
  let executions = 0;
  let retrievals = 0;
  const adapter = gateway(async () => { executions++; return { status: "SUCCEEDED", reference: "never" }; }, async () => { retrievals++; return { status: "SUCCEEDED", reference: "recovered" }; });
  assert.equal((await reconcileCustomerPaymentOperation(operation.id, adapter)).ok, true);
  assert.equal(executions, 0);
  assert.equal(retrievals, 1);
});

test("captured payment with local write failure preserves reference and reconciles once", async (t) => {
  const f = await fixture(t);
  let executions = 0;
  const adapter = gateway(async () => { executions++; return { status: "SUCCEEDED", reference: "integration-local-failure" }; }, async () => ({ status: "SUCCEEDED", reference: "integration-local-failure" }));
  if (postgres) {
    await db.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION integration_payment_failure_fn() RETURNS trigger AS $$ BEGIN IF NEW."gatewayRef" = 'integration-local-failure' THEN RAISE EXCEPTION 'injected local failure'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql`);
    await db.$executeRawUnsafe(`CREATE TRIGGER integration_payment_failure BEFORE INSERT ON "Payment" FOR EACH ROW EXECUTE FUNCTION integration_payment_failure_fn()`);
  } else {
    await db.$executeRawUnsafe(`CREATE TRIGGER integration_payment_failure BEFORE INSERT ON Payment WHEN NEW.gatewayRef = 'integration-local-failure' BEGIN SELECT RAISE(FAIL, 'injected local failure'); END`);
  }
  try {
    assert.equal((await runCustomerPayment(f.input, adapter)).ok, false);
  } finally {
    if (postgres) {
      await db.$executeRawUnsafe('DROP TRIGGER integration_payment_failure ON "Payment"');
      await db.$executeRawUnsafe("DROP FUNCTION integration_payment_failure_fn()");
    } else await db.$executeRawUnsafe("DROP TRIGGER integration_payment_failure");
  }
  const operation = await db.moneyOperation.findUniqueOrThrow({ where: { key: `${f.order.id}:DEPOSIT` } });
  assert.equal(operation.status, "UNKNOWN");
  assert.equal(operation.gatewayRef, "integration-local-failure");
  assert.equal(await db.payment.count({ where: { orderId: f.order.id } }), 0);
  assert.equal((await runCustomerPayment(f.input, adapter)).ok, false);
  assert.equal((await reconcileCustomerPaymentOperation(operation.id, adapter)).ok, true);
  assert.equal((await reconcileCustomerPaymentOperation(operation.id, adapter)).ok, true);
  assert.equal(executions, 1);
  assert.equal(await db.payment.count({ where: { orderId: f.order.id } }), 1);
});

test("unauthorized customer cannot pay or cancel another customer's order", async (t) => {
  const f = await fixture(t);
  let calls = 0;
  const adapter = gateway(async () => { calls++; return { status: "SUCCEEDED", reference: "never" }; });
  assert.equal((await runCustomerPayment({ ...f.input, userId: "another-user" }, adapter)).ok, false);
  assert.equal((await cancelCustomerOrder(f.order.id, "another-user")).ok, false);
  assert.equal(calls, 0);
  assert.equal(await db.moneyOperation.count({ where: { orderId: f.order.id } }), 0);
});

test("legacy overpayment is blocked for manual inspection", async (t) => {
  const f = await fixture(t, "DONE", 1100);
  let calls = 0;
  const adapter = gateway(async () => { calls++; return { status: "SUCCEEDED", reference: "never" }; });
  assert.equal((await runCustomerPayment({ ...f.input, kind: "PAYMENT_BALANCE" }, adapter)).ok, false);
  assert.equal(calls, 0);
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: f.order.id } })).status, "DONE");
  assert.equal(await db.shrine.count({ where: { userId: f.customer.id } }), 0);
});

test("asynchronous QR reserves once, resumes the same charge, and only completes on retrieval", async (t) => {
  const f = await fixture(t);
  let creates = 0;
  let reads = 0;
  let paid = false;
  const nextAction = { status: "PENDING" as const, qrUrl: "https://api.omise.co/test-qr", expiresAt: new Date(Date.now() + 900000).toISOString() };
  const adapter: PaymentGateway = { name: "omise_test",
    execute: async () => { creates++; return { status: "PENDING", reference: "chrg_test_fixture", nextAction }; },
    retrieve: async (input) => {
      reads++;
      assert.equal(input.gatewayReference, "chrg_test_fixture");
      return paid ? { status: "SUCCEEDED", reference: "chrg_test_fixture" } :
        { status: "PENDING", reference: "chrg_test_fixture", nextAction };
    } };
  const first = await runCustomerPayment(f.input, adapter);
  assert.ok(first.ok && first.data?.status === "PENDING");
  assert.equal(await db.payment.count({ where: { orderId: f.order.id } }), 0);
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: f.order.id } })).status, "AWAITING_DEPOSIT");
  const op = await db.moneyOperation.findFirstOrThrow({ where: { orderId: f.order.id } });
  assert.equal((await checkCustomerPayment(op.id, "other-customer", adapter)).ok, false);
  assert.equal(reads, 0);
  await db.moneyOperation.update({ where: { id: op.id }, data: { updatedAt: new Date(Date.now() - 4000) } });
  const resumed = await runCustomerPayment(f.input, adapter);
  assert.ok(resumed.ok && resumed.data?.status === "PENDING");
  assert.equal(creates, 1);
  paid = true;
  await db.moneyOperation.update({ where: { id: op.id }, data: { updatedAt: new Date(Date.now() - 4000) } });
  const completed = await runCustomerPayment(f.input, adapter);
  assert.ok(completed.ok && completed.data === undefined);
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: f.order.id } })).status, "AWAITING_PROVIDER");
  assert.equal(await db.payment.count({ where: { orderId: f.order.id, status: "PAID" } }), 1);
  assert.equal((await runCustomerPayment(f.input, adapter)).ok, true);
  assert.equal(creates, 1);
});

async function ensureInboxSchema() {
  const sql = await readFile("prisma/postgresql/migrations/20261018020000_webhook_inbox/migration.sql", "utf8");
  for (const statement of sql.split(";").map((v) => v.trim()).filter(Boolean)) {
    await db.$executeRawUnsafe(statement.replace("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ")
      .replace("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS "));
  }
}

test("durable inbox deduplicates, resumes after lease expiry, retrieves provider truth and finalizes once", async (t) => {
  await ensureInboxSchema();
  const f = await fixture(t);
  const id = `evnt_test_${randomUUID().replaceAll("-", "")}`;
  const chargeId = `chrg_test_${randomUUID().replaceAll("-", "")}`;
  t.after(async () => { await db.$executeRaw`DELETE FROM "ProviderWebhookEvent" WHERE "id" = ${id}`; });
  const adapter: PaymentGateway = { name: "omise_test",
    execute: async () => ({ status: "PENDING", reference: chargeId,
      nextAction: { status: "PENDING", qrUrl: "https://api.omise.co/test", expiresAt: new Date().toISOString() } }),
    retrieve: async () => ({ status: "SUCCEEDED", reference: chargeId }),
  };
  await runCustomerPayment(f.input, adapter);
  const body = Buffer.from(JSON.stringify({ object: "event", id, livemode: false, key: "charge.complete",
    data: { object: "charge", id: chargeId, livemode: false, status: "failed" } }));
  // Payload's status deliberately disagrees: only the independent GET is authoritative.
  assert.equal(await storeOmiseEvent(body), "STORED");
  assert.equal(await storeOmiseEvent(body), "STORED");
  const rows = await db.$queryRaw<{ id: string }[]>`SELECT "id" FROM "ProviderWebhookEvent" WHERE "id" = ${id}`;
  assert.equal(rows.length, 1);
  await db.$executeRaw`UPDATE "ProviderWebhookEvent" SET "leaseUntil" = ${new Date(Date.now() + 60000).toISOString()} WHERE "id" = ${id}`;
  assert.equal((await reconcileOmiseBatch(adapter)).processed, 0);
  await db.$executeRaw`UPDATE "ProviderWebhookEvent" SET "leaseUntil" = '' WHERE "id" = ${id}`;
  assert.equal((await reconcileOmiseBatch(adapter)).processed, 1);
  assert.equal((await reconcileOmiseBatch(adapter)).processed, 0);
  assert.equal(await db.payment.count({ where: { orderId: f.order.id } }), 1);
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: f.order.id } })).status, "AWAITING_PROVIDER");
  await assert.rejects(storeOmiseEvent(Buffer.from(body.toString().replace('"failed"', '"pending"'))));
});

test("unpaid asynchronous balance never completes work; missing callback polling completes once", async (t) => {
  await ensureInboxSchema();
  const f = await fixture(t, "DONE", 300);
  let creates = 0;
  let reads = 0;
  let paid = false;
  const chargeId = `chrg_test_${randomUUID().replaceAll("-", "")}`;
  const nextAction = { status: "PENDING" as const, qrUrl: "https://api.omise.co/test", expiresAt: new Date(Date.now() + 900000).toISOString() };
  const adapter: PaymentGateway = { name: "omise_test",
    execute: async (input) => {
      creates++;
      assert.equal(input.amountMinor, 70000);
      return { status: "PENDING", reference: chargeId, nextAction };
    },
    retrieve: async (input) => {
      reads++;
      assert.equal(input.gatewayReference, chargeId);
      return paid ? { status: "SUCCEEDED", reference: chargeId } : { status: "PENDING", reference: chargeId, nextAction };
    },
  };
  const input = { ...f.input, kind: "PAYMENT_BALANCE" as const };
  assert.equal((await runCustomerPayment(input, adapter)).ok, true);
  const op = await db.moneyOperation.findUniqueOrThrow({ where: { key: `${f.order.id}:BALANCE` } });
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: f.order.id } })).status, "DONE");
  assert.equal(await db.payment.count({ where: { orderId: f.order.id } }), 1);
  assert.equal(await db.shrine.count({ where: { userId: f.customer.id } }), 0);
  const repeated = await runCustomerPayment(input, adapter);
  if (repeated.ok) assert.equal(repeated.data?.status, "PENDING"); // A slow runner may already pass the throttle window.
  assert.equal(creates, 1);
  await db.moneyOperation.update({ where: { id: op.id }, data: { updatedAt: new Date(Date.now() - 61000) } });
  await reconcileOmiseBatch(adapter);
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: f.order.id } })).status, "DONE");
  assert.equal(await db.payment.count({ where: { orderId: f.order.id } }), 1);
  paid = true;
  await db.moneyOperation.update({ where: { id: op.id }, data: { updatedAt: new Date(Date.now() - 61000) } });
  await reconcileOmiseBatch(adapter);
  const completed = await db.order.findUniqueOrThrow({ where: { id: f.order.id } });
  assert.equal(completed.status, "COMPLETED");
  assert.ok(completed.shrineId);
  assert.equal(await db.payment.count({ where: { orderId: f.order.id, kind: "BALANCE", status: "PAID" } }), 1);
  assert.equal(await db.shrine.count({ where: { userId: f.customer.id } }), 1);
  assert.equal(await db.orderEvent.count({ where: { orderId: f.order.id, title: "ลูกค้าตรวจรับงานแล้ว" } }), 1);
  const readsBeforeRepeat = reads;
  assert.equal((await runCustomerPayment(input, adapter)).ok, true);
  await reconcileOmiseBatch(adapter);
  assert.equal(creates, 1);
  assert.equal(reads, readsBeforeRepeat);
  assert.equal(await db.payment.count({ where: { orderId: f.order.id } }), 2);
});

test("concurrent balance confirmation creates one completion event, payment and shrine", async (t) => {
  const f = await fixture(t, "DONE", 300);
  let creates = 0;
  const chargeId = `chrg_test_${randomUUID().replaceAll("-", "")}`;
  const adapter: PaymentGateway = { name: "omise_test",
    execute: async () => { creates++; return { status: "PENDING", reference: chargeId,
      nextAction: { status: "PENDING", qrUrl: "https://api.omise.co/test", expiresAt: new Date().toISOString() } }; },
    retrieve: async () => ({ status: "SUCCEEDED", reference: chargeId }),
  };
  await runCustomerPayment({ ...f.input, kind: "PAYMENT_BALANCE" }, adapter);
  const op = await db.moneyOperation.findUniqueOrThrow({ where: { key: `${f.order.id}:BALANCE` } });
  const results = await Promise.all([
    reconcileCustomerPaymentOperation(op.id, adapter), reconcileCustomerPaymentOperation(op.id, adapter),
  ]);
  assert.ok(results.some((result) => result.ok));
  assert.equal(creates, 1);
  assert.equal(await db.payment.count({ where: { orderId: f.order.id, kind: "BALANCE" } }), 1);
  assert.equal(await db.shrine.count({ where: { userId: f.customer.id } }), 1);
  assert.equal(await db.orderEvent.count({ where: { orderId: f.order.id, title: "ลูกค้าตรวจรับงานแล้ว" } }), 1);
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: f.order.id } })).status, "COMPLETED");
});

test("cancelled paid Omise deposit creates one refund obligation without claiming money was returned", async (t) => {
  const f = await fixture(t, "AWAITING_PROVIDER", 300);
  await db.payment.updateMany({ where: { orderId: f.order.id }, data: { gateway: "omise_test" } });
  const results = await Promise.allSettled([
    cancelCustomerOrder(f.order.id, f.customer.id), cancelCustomerOrder(f.order.id, f.customer.id),
  ]);
  assert.ok(results.some((result) => result.status === "fulfilled" && result.value.ok));
  assert.equal((await cancelCustomerOrder(f.order.id, f.customer.id)).ok, true);
  const cases = await db.moneyOperation.findMany({ where: { orderId: f.order.id, kind: "REFUND" } });
  assert.equal(cases.length, 1);
  assert.equal(cases[0].status, "ACTION_REQUIRED");
  assert.equal(cases[0].amountMinor, 30000);
  assert.equal(cases[0].gatewayRef, "");
  assert.equal(cases[0].completedAt, null);
  assert.ok(cases[0].paymentId);
  assert.equal(await db.payment.count({ where: { orderId: f.order.id, status: "PAID" } }), 1);
  assert.equal(await db.payment.count({ where: { orderId: f.order.id, status: "REFUNDED" } }), 0);
  assert.equal(await db.orderEvent.count({ where: { orderId: f.order.id, title: "คืนเงินแล้ว" } }), 0);
});

test.after(async () => { await db.$disconnect(); });
