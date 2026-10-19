import assert from "node:assert/strict";
import test from "node:test";
import { browseReturn } from "../src/lib/browse-return";

test("preserves browse filters while removing unrelated parameters and hashes", () => {
  assert.equal(browseReturn("/browse?area=BKK&max=1500&next=https://evil.example#x"), "/browse?area=BKK&max=1500");
  assert.equal(browseReturn("/browse"), "/browse");
});
test("rejects external, protocol-relative and deceptive local destinations", () => {
  for (const path of ["https://evil.example/browse", "//evil.example", "/browse/../admin", "/browse-other", "/browse\\evil", "javascript:alert(1)"]) {
    assert.equal(browseReturn(path), undefined);
  }
});
