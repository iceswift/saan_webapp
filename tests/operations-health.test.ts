import assert from "node:assert/strict";
import { test } from "node:test";
import { healthState } from "../src/server/operations-health";

test("worker health distinguishes missing, failed, stale and invalid timestamps", () => {
  const now = Date.now();
  assert.equal(healthState(null, 300000, now), "missing");
  assert.equal(healthState({checkedAt:new Date(now).toISOString(),ok:true},300000,now),"good");
  assert.equal(healthState({checkedAt:new Date(now).toISOString(),ok:false},300000,now),"failed");
  assert.equal(healthState({checkedAt:new Date(now-300001).toISOString(),ok:true},300000,now),"stale");
  assert.equal(healthState({checkedAt:"invalid",ok:true},300000,now),"stale");
  assert.equal(healthState({checkedAt:new Date(now+120000).toISOString(),ok:true},300000,now),"stale");
});
