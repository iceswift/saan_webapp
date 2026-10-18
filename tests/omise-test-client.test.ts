import assert from "node:assert/strict";
import { test } from "node:test";
import { createOmiseTestClient, OmiseTestError } from "../src/server/omise-test-client";

const env = { OMISE_TEST_SECRET_KEY: "skey_test_fixture", OMISE_API_VERSION: "2019-05-29" };
const expected = { amountMinor: 327000, reference: "order1:DEPOSIT:1" };
const fixture = { object: "charge", id: "chrg_test_abc123", livemode: false,
  amount: expected.amountMinor, currency: "thb", status: "pending", paid: false,
  ref_id: expected.reference, source: { type: "promptpay", scannable_code: {
    image: { download_uri: "https://api.omise.co/documents/qr/download" },
  } } };
const expiry = () => new Date(Date.now() + 900_000).toISOString();
function response(value: unknown = fixture, status = 200): typeof fetch {
  return async () => new Response(JSON.stringify(value), { status });
}
function code(value: string) {
  return (error: unknown) => error instanceof OmiseTestError && error.code === value;
}

test("test client refuses missing configuration, live keys and production", () => {
  for (const config of [{}, { ...env, OMISE_TEST_SECRET_KEY: "skey_live_fixture" },
    { ...env, APP_ENV: "production" }, { ...env, OMISE_API_VERSION: "latest" }]) {
    assert.throws(() => createOmiseTestClient(config), code("CONFIGURATION"));
  }
});
test("QR creation is pending; request uses fixed HTTPS origin, form body and stable reference", async () => {
  let calls = 0;
  const transport: typeof fetch = async (url, options) => {
    calls++;
    assert.equal(url, "https://api.omise.co/charges");
    assert.equal(options?.method, "POST");
    assert.equal(options?.redirect, "error");
    assert.equal(options?.cache, "no-store");
    const body = new URLSearchParams(String(options?.body));
    assert.equal(body.get("amount"), "327000");
    assert.equal(body.get("source[type]"), "promptpay");
    assert.equal(body.get("ref_id"), expected.reference);
    return new Response(JSON.stringify(fixture));
  };
  const charge = await createOmiseTestClient(env, transport).createPromptPay(expected, expiry());
  assert.equal(charge.status, "pending");
  assert.equal(charge.paid, false);
  assert.equal(calls, 1);
});
test("network timeout or ambiguous provider response is UNKNOWN without automatic retry", async () => {
  for (const status of [408, 409, 429, 500, 503]) {
    let calls = 0;
    const client = createOmiseTestClient(env, async () => {
      calls++; return new Response("{}", { status });
    });
    await assert.rejects(client.createPromptPay(expected, expiry()), code("UNKNOWN"));
    assert.equal(calls, 1);
  }
  const client = createOmiseTestClient(env, async () => { throw new Error(env.OMISE_TEST_SECRET_KEY); });
  await assert.rejects(client.createPromptPay(expected, expiry()), (error: unknown) => {
    assert.ok(error instanceof OmiseTestError);
    assert.equal(error.code, "UNKNOWN");
    assert.ok(!error.message.includes(env.OMISE_TEST_SECRET_KEY));
    return true;
  });
});
test("rejects live/mismatched/contradictory provider objects", async () => {
  for (const patch of [{ livemode: true }, { amount: 1 }, { currency: "USD" },
    { ref_id: "other" }, { source: { type: "card" } }, { paid: true },
    { id: "chrg_live123" }, { source: { type: "promptpay", scannable_code: {
      image: { download_uri: "http://example.com/qr" },
    } } }]) {
    await assert.rejects(createOmiseTestClient(env, response({ ...fixture, ...patch }))
      .createPromptPay(expected, expiry()), code("MISMATCH"));
  }
});
test("retrieval only GETs the expected charge and validates its identity", async () => {
  const client = createOmiseTestClient(env, async (url, options) => {
    assert.equal(url, "https://api.omise.co/charges/chrg_test_abc123");
    assert.equal(options?.method, "GET");
    return new Response(JSON.stringify({ ...fixture, status: "successful", paid: true }));
  });
  assert.equal((await client.retrievePromptPay({ ...expected, chargeId: fixture.id })).paid, true);
  await assert.rejects(client.retrievePromptPay({ ...expected, chargeId: "../charges" }), code("CONFIGURATION"));
  await assert.rejects(createOmiseTestClient(env, response({ ...fixture, id: "chrg_test_other" }))
    .retrievePromptPay({ ...expected, chargeId: fixture.id }), code("MISMATCH"));
});
test("invalid amounts and expiry make no provider requests", async () => {
  const client = createOmiseTestClient(env, async () => { assert.fail("must not send"); });
  for (const amountMinor of [1999, 15000001, 2000.5, NaN]) {
    await assert.rejects(client.createPromptPay({ ...expected, amountMinor }, expiry()), code("CONFIGURATION"));
  }
  for (const date of ["bad", new Date(0).toISOString(), new Date(Date.now() + 90_000_000).toISOString()]) {
    await assert.rejects(client.createPromptPay(expected, date), code("CONFIGURATION"));
  }
});
