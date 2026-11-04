import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeThaiDigits, normalizeThaiPhone } from "../src/lib/phone-input";
import { safeLoginNext } from "../src/app/login/safe-next";
import { phoneSchema } from "../src/server/action-utils";

test("Thai digits and common local/international phone formatting resolve to one identity", () => {
  for (const input of ["๐๘๐-๐๐๐-๐๐๐๒", "080 000 0002", "+66 (80) 000-0002", "66800000002"]) {
    assert.equal(normalizeThaiPhone(input), "0800000002");
    assert.equal(phoneSchema.parse(input), "0800000002");
  }
  assert.equal(normalizeThaiDigits("รหัส ๐๑๒๓๔๕"), "รหัส 012345");
  for (const input of ["abc0800000002", "08000000020", "+1 800 000 002", "๐๘๐.๐๐๐.๐๐๐๒"]) assert.equal(phoneSchema.safeParse(input).success, false);
});

test("login returns to the intended internal task without accepting external or normalized protocol-relative URLs", () => {
  assert.equal(safeLoginNext("/new/checkout?productId=test&area=BKK"), "/new/checkout?productId=test&area=BKK");
  assert.equal(safeLoginNext("/orders/test#payments"), "/orders/test#payments");
  for (const next of [undefined, ["/orders"], "https://other.invalid", "//other.invalid", "/\\other.invalid", "/%5cother.invalid", "/%2fother.invalid", "/a/..//other.invalid", "/\n/other.invalid", "/login", "/login/?next=/login"]) assert.equal(safeLoginNext(next), "/");
});
