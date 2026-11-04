import assert from "node:assert/strict";
import { test } from "node:test";
import { launchConfiguration, supportConfiguration } from "../src/server/launch-config";

test("missing services remain explicit and never authorize a public launch", () => {
  const result = launchConfiguration({ SITE_URL: "https://iceberg.taile08e5c.ts.net:8443" });
  assert.equal(result.canLaunch, false);
  assert.equal(result.checks.find(check => check.id === "domain")?.state, "missing");
  assert.equal(result.checks.find(check => check.id === "sms")?.state, "blocked");
  assert.equal(result.checks.find(check => check.id === "support")?.state, "missing");
  assert.deepEqual(supportConfiguration({}), { contacts: [], invalid: [] });
});

test("public support contacts canonicalize phone input and allow only official contact URLs", () => {
  const result = supportConfiguration({ SUPPORT_EMAIL: "support+test@saan.invalid", SUPPORT_PHONE: "+66 80 000 0002", SUPPORT_LINE_URL: "https://line.me/R/ti/p/@saan-test" });
  assert.deepEqual(result.invalid, []);
  assert.equal(result.contacts.length, 3);
  assert.equal(result.contacts[0].href, "mailto:support%2Btest%40saan.invalid");
  assert.equal(result.contacts[1].value, "0800000002");
  assert.equal(result.contacts[1].href, "tel:+66800000002");
  assert.equal(result.contacts[2].href, "https://line.me/R/ti/p/@saan-test");
  assert.equal(supportConfiguration({ SUPPORT_LINE_URL: "https://lin.ee/test" }).contacts.length, 1);
});

test("invalid contacts never turn into injectable links or leak raw values into readiness", () => {
  for (const email of ["a..b@example.com", "a.@example.com", `${"x".repeat(65)}@example.com`]) assert.equal(supportConfiguration({ SUPPORT_EMAIL: email }).contacts.length, 0);
  for (const line of ["javascript:alert(1)", "http://lin.ee/test", "https://line.me.evil.invalid/R/ti/p/@test", "https://secret@lin.ee/test", "https://lin.ee/test?redirect=elsewhere", "https://line.me/other"]) assert.equal(supportConfiguration({ SUPPORT_LINE_URL: line }).contacts.length, 0);
  const env = { SUPPORT_EMAIL: "SECRET\r\nBcc:other@example.com", SUPPORT_PHONE: "SECRET", SUPPORT_LINE_URL: "https://SECRET@lin.ee/test", SMS_PROVIDER: "SECRET", SMS_SEND_ENABLED: "true", OMISE_TEST_SECRET_KEY: "SECRET" };
  assert.equal(supportConfiguration(env).contacts.length, 0);
  const report = launchConfiguration(env);
  assert.equal(report.checks.find(check => check.id === "sms")?.state, "invalid");
  assert.equal(JSON.stringify(report).includes("SECRET"), false);
  assert.equal(report.canLaunch, false);
});

test("domain syntax is never mistaken for proof of external-service readiness", () => {
  for (const origin of ["http://saan.example.th", "https://127.0.0.1", "https://[::1]", "https://localhost.", "https://example.com", "https://private.ts.net", "https://user:secret@saan.example.th", "https://saan.example.th/path"]) assert.equal(launchConfiguration({ SITE_URL: origin }).checks[0].state, "missing");
  const result = launchConfiguration({ SITE_URL: "https://saan.example.th", SUPPORT_EMAIL: "support@saan.example.th" });
  assert.equal(result.checks[0].state, "configured");
  assert.equal(result.canLaunch, false);
  assert.equal(result.checks.find(check => check.id === "payments")?.state, "blocked");
});
