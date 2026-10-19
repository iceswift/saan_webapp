import assert from "node:assert/strict";
import test from "node:test";
import { homeAgenda } from "../src/lib/home-agenda";
import type { OrderSummary } from "../src/lib/types";

function order(id: string, status: OrderSummary["status"], scheduledAt: string | null = null): OrderSummary {
  return { id, status, scheduledAt, createdAt: "2026-10-20T00:00:00Z" } as OrderSummary;
}

test("customer decisions precede appointments and closed orders are excluded", () => {
  const source = [order("wait", "AWAITING_PROVIDER"), order("closed", "COMPLETED"), order("pay", "AWAITING_DEPOSIT"), order("accept", "DONE"), order("cancel", "CANCELLED")];
  assert.deepEqual(homeAgenda(source).map(item => item.id), ["accept", "pay", "wait"]);
  assert.equal(source[0].id, "wait");
  assert.equal(source.length, 5);
});

test("nearest appointments precede later and unscheduled confirmed jobs", () => {
  const source = [order("none", "CONFIRMED"), order("later", "CONFIRMED", "2026-10-25T09:00:00Z"), order("soon", "CONFIRMED", "2026-10-21T09:00:00Z")];
  assert.deepEqual(homeAgenda(source).map(item => item.id), ["soon", "later", "none"]);
});
