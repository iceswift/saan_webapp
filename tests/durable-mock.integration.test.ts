import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { db } from "../src/server/db";
import { durableMockGateway } from "../src/server/durable-mock-gateway";
import type { GatewayRequest } from "../src/server/payment-gateway";

const databaseUrl = process.env.DATABASE_URL ?? "";
if (databaseUrl.startsWith("postgres")) assert.equal(new URL(databaseUrl).pathname, "/saan_test");
else assert.match(databaseUrl, /money-test\.db$/);

test("durable simulated receipts survive another process and reject changed requests", async (t) => {
  const input: GatewayRequest = { idempotencyKey: randomUUID(), amountMinor: 30000, kind: "PAYMENT_DEPOSIT", currency: "THB", reference: "test" };
  t.after(async () => { await db.mockGatewayReceipt.deleteMany({ where: { key: input.idempotencyKey } }); });
  assert.equal((await durableMockGateway.retrieve(input)).status, "UNKNOWN");
  const outcomes = await Promise.all([durableMockGateway.execute(input), durableMockGateway.execute(input)]);
  assert.deepEqual(outcomes[0], outcomes[1]);
  assert.equal(await db.mockGatewayReceipt.count({ where: { key: input.idempotencyKey } }), 1);
  const code = `const {durableMockGateway}=require('./src/server/durable-mock-gateway.ts'); const {db}=require('./src/server/db.ts'); durableMockGateway.retrieve(JSON.parse(process.env.TEST_RECEIPT)).then(async r=>{console.log(JSON.stringify(r));await db.$disconnect()}).catch(()=>process.exit(1));`;
  const other = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "-e", code], {
    env: { ...process.env, TEST_RECEIPT: JSON.stringify(input) }, encoding: "utf8", timeout: 20000,
  });
  assert.equal(other.status, 0, other.stderr);
  assert.deepEqual(JSON.parse(other.stdout.trim()), outcomes[0]);
  await assert.rejects(durableMockGateway.execute({ ...input, amountMinor: 40000 }));
  await assert.rejects(durableMockGateway.retrieve({ ...input, amountMinor: 40000 }));
});
test.after(async () => { await db.$disconnect(); });
