import assert from "node:assert/strict";
import { test } from "node:test";
import { describeOrderStatus } from "../src/app/orders/[id]/describe-order-status";
import type { OrderDetail } from "../src/lib/types";

const provider = { name: "Test shop" } as OrderDetail["provider"];

test("A-06: the confirmed buyer status includes the appointment in ICT", () => {
  const status = describeOrderStatus({
    provider,
    status: "CONFIRMED",
    scheduledAt: "2026-11-28T03:00:00.000Z",
    payments: [],
  });

  assert.equal(status.title, "ร้านนัดเข้างาน ส. 28 พ.ย. 10:00 น.");
});

test("a confirmed order without an appointment retains its fallback", () => {
  const status = describeOrderStatus({
    provider,
    status: "CONFIRMED",
    scheduledAt: null,
    payments: [],
  });

  assert.equal(status.title, "ร้านยืนยันแล้ว");
});
