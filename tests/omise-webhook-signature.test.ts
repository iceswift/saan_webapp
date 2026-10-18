import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { verifyOmiseWebhookSignature } from "../src/server/omise-webhook-signature";

const body = Buffer.from('{ "key": "charge.complete", "text": "ชำระเงิน" }');
const key = Buffer.from("test-only-signing-key");
const secret = key.toString("base64");
const timestamp = "1800000000";
const signature = createHmac("sha256", key).update(`${timestamp}.`).update(body).digest("hex");
const valid = { body, signature, timestamp, secrets: [secret], nowSeconds: Number(timestamp) };

test("Omise HMAC verifies original raw bytes using decoded Base64 secret", () => {
  assert.equal(verifyOmiseWebhookSignature(valid), true);
  assert.equal(verifyOmiseWebhookSignature({ ...valid, body: Buffer.from(JSON.stringify(JSON.parse(body.toString()))) }), false);
  assert.equal(verifyOmiseWebhookSignature({ ...valid, body: Buffer.from("changed") }), false);
});
test("rejects missing, malformed, incorrect and oversized signature inputs without throwing", () => {
  for (const patch of [{ signature: null }, { timestamp: null }, { signature: "bad" },
    { signature: "0".repeat(64) }, { timestamp: "not-a-time" }, { secrets: [] },
    { secrets: ["not base64"] }, { secrets: [""] }, { secrets: [Buffer.from("wrong").toString("base64")] },
    { signature: "0".repeat(1025) }, { body: new Uint8Array(1_048_577) }]) {
    assert.equal(verifyOmiseWebhookSignature({ ...valid, ...patch }), false);
  }
});
test("checks a five-minute window in both directions including its boundary", () => {
  for (const difference of [-301, 301]) {
    assert.equal(verifyOmiseWebhookSignature({ ...valid, nowSeconds: Number(timestamp) + difference }), false);
  }
  for (const difference of [-300, 300]) {
    assert.equal(verifyOmiseWebhookSignature({ ...valid, nowSeconds: Number(timestamp) + difference }), true);
  }
});
test("accepts rotated signatures and secrets without accepting malformed candidates", () => {
  const other = Buffer.from("second-test-key").toString("base64");
  assert.equal(verifyOmiseWebhookSignature({ ...valid, signature: `${"0".repeat(64)}, ${signature}`, secrets: [other, secret] }), true);
  assert.equal(verifyOmiseWebhookSignature({ ...valid, signature: `${signature},bad` }), false);
  assert.equal(verifyOmiseWebhookSignature({ ...valid, secrets: [secret, "invalid"] }), false);
});
