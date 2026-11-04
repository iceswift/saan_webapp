import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWholeBaht } from "../src/lib/baht-input";

test("whole-baht entry accepts Thai digits and correct thousands groups without changing the intended amount", () => {
  for (const value of ["1500", "1,500", "๑,๕๐๐", " ๑๕๐๐ "]) assert.equal(parseWholeBaht(value), 1500);
  assert.equal(parseWholeBaht("10,000,000"), 10_000_000);
  assert.equal(parseWholeBaht("0"), 0);
  for (const value of ["", "1,5", "15,00", "1.50", "-1500", "1e3", "0x100", "Infinity", "10,000,001", "1,500บาท"]) assert.equal(parseWholeBaht(value), null);
});
