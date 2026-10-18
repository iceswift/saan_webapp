import assert from "node:assert/strict";
import { test } from "node:test";
import { cancelledPaymentDetail } from "../src/app/orders/[id]/cancelled-payment-detail";

test("partial refund is never described as fully refunded", () => {
  assert.match(cancelledPaymentDetail([{ status: "REFUNDED" }, { status: "PAID" }]), /บางส่วน/);
  assert.match(cancelledPaymentDetail([{ status: "PAID" }]), /ยังไม่ได้คืนเงิน/);
  assert.equal(cancelledPaymentDetail([{ status: "REFUNDED" }, { status: "REFUNDED" }]), "คืนเงินครบแล้ว");
  assert.ok(!cancelledPaymentDetail([]).includes("คืนเงินครบแล้ว"));
});
