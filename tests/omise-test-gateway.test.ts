import assert from "node:assert/strict";
import { test } from "node:test";
import { createOmiseTestGateway } from "../src/server/omise-test-gateway";
import type { TestCharge } from "../src/server/omise-test-client";
import type { GatewayRequest } from "../src/server/payment-gateway";

const request: GatewayRequest = { kind: "PAYMENT_DEPOSIT", amountMinor: 2000, currency: "THB",
  method: "PROMPTPAY", idempotencyKey: "order:DEPOSIT", reference: "SA-TEST" };
const charge: TestCharge = { object: "charge", id: "chrg_test_fixture", livemode: false,
  amount: 2000, currency: "THB", status: "pending", paid: false,
  source: { type: "promptpay", scannable_code: { image: {
    download_uri: "https://api.omise.co/charges/chrg_test_fixture/documents/doc_test/downloads/token",
  } } }, expires_at: "2026-10-18T12:00:00Z" };

test("Omise adapter returns pending QR and retrieves the saved ID before success", async () => {
  const adapter = createOmiseTestGateway(() => ({
    createPromptPay: async (input) => { assert.equal(input.reference, request.idempotencyKey); return charge; },
    retrievePromptPay: async (input) => {
      assert.equal(input.chargeId, charge.id);
      return { ...charge, paid: true, status: "successful" };
    },
  }));
  const pending = await adapter.execute(request);
  assert.equal(pending.status, "PENDING");
  assert.equal(pending.nextAction?.qrUrl, charge.source.scannable_code?.image.download_uri);
  const paid = await adapter.retrieve({ ...request, gatewayReference: pending.reference });
  assert.equal(paid.status, "SUCCEEDED");
  assert.equal(paid.reference, charge.id);
});
test("unsupported refunds, payouts, cards and missing reference never call provider", async () => {
  const adapter = createOmiseTestGateway(() => { assert.fail("must not contact provider"); });
  for (const kind of ["REFUND", "PAYOUT"] as const) assert.equal((await adapter.execute({ ...request, kind })).status, "FAILED");
  assert.equal((await adapter.execute({ ...request, method: "CARD" })).status, "FAILED");
  assert.equal((await adapter.retrieve(request)).status, "UNKNOWN");
});
test("untrusted QR destinations are never exposed to the customer", async () => {
  const adapter = createOmiseTestGateway(() => ({
    createPromptPay: async () => ({ ...charge, source: { type: "promptpay", scannable_code: {
      image: { download_uri: "https://example.com/qr" },
    } } }),
    retrievePromptPay: async () => charge,
  }));
  const result = await adapter.execute(request);
  assert.equal(result.status, "UNKNOWN");
  assert.equal(result.nextAction, undefined);
});
