import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";

test("sandbox endpoints fail closed before authentication and reject malformed signed payloads", async () => {
  process.env.APP_ENV = "test";
  process.env.PAYMENT_PROVIDER = "omise_test";
  const hook = await import("../src/app/api/webhooks/omise/route");
  const worker = await import("../src/app/api/internal/payment-reconcile/route");
  const request = () => new Request("https://example.test/api/webhooks/omise", { method: "POST", body: "{}" });
  delete process.env.OMISE_WEBHOOK_ENABLED;
  assert.equal((await hook.POST(request())).status, 404);
  process.env.OMISE_WEBHOOK_ENABLED = "true";
  delete process.env.OMISE_WEBHOOK_SECRET;
  assert.equal((await hook.POST(request())).status, 503);
  process.env.OMISE_WEBHOOK_SECRET = Buffer.from("test-signing-secret").toString("base64");
  assert.equal((await hook.POST(request())).status, 401);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", Buffer.from("test-signing-secret")).update(`${timestamp}.{`).digest("hex");
  assert.equal((await hook.POST(new Request("https://example.test", { method: "POST", body: "{",
    headers: { "Omise-Signature": signature, "Omise-Signature-Timestamp": timestamp } }))).status, 400);
  assert.equal((await hook.POST(new Request("https://example.test", { method: "POST", body: "a".repeat(1_048_577) }))).status, 413);
  delete process.env.PAYMENT_RECONCILIATION_ENABLED;
  assert.equal((await worker.POST(request())).status, 404);
  process.env.PAYMENT_RECONCILIATION_ENABLED = "true";
  process.env.PAYMENT_WORKER_SECRET = "short";
  assert.equal((await worker.POST(request())).status, 404);
  process.env.PAYMENT_WORKER_SECRET = "fixture-secret-with-at-least-32-characters";
  assert.equal((await worker.POST(request())).status, 401);
});
