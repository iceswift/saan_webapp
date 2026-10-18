import { createHash } from "node:crypto";
import type { PaymentMethod } from "../lib/constants";

export type MoneyKind = "PAYMENT_DEPOSIT" | "PAYMENT_BALANCE" | "REFUND" | "PAYOUT";
export type GatewayRequest = {
  kind: MoneyKind;
  amountMinor: number;
  currency: "THB";
  idempotencyKey: string;
  reference: string;
  method?: PaymentMethod;
  originalReference?: string;
  gatewayReference?: string;
};
export type GatewayResult = {
  status: "SUCCEEDED" | "PENDING" | "FAILED" | "UNKNOWN";
  reference: string;
  error?: string;
  nextAction?: import("../lib/payment-result").PendingPayment;
};
/** A real adapter must verify provider responses/webhooks and enforce this key remotely.
 * execute must never interpret a browser redirect or a network timeout as payment success.
 * retrieve reconciles the SAME operation; it must never create a new charge/transfer.
 */
export interface PaymentGateway {
  readonly name: string;
  readonly capabilities?: { refund: boolean; payout: boolean };
  execute(input: GatewayRequest): Promise<GatewayResult>;
  retrieve(input: GatewayRequest): Promise<GatewayResult>;
}

export function validateMoneyRequest(input: GatewayRequest) {
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0 ||
      input.amountMinor > 2_147_483_647 || input.currency !== "THB" || !input.idempotencyKey) {
    throw new Error("จำนวนเงินหรือสกุลเงินไม่ถูกต้อง");
  }
}

const mockReceipts = new Map<string, { fingerprint: string; result: GatewayResult }>();

/** Process-local test receipts. Unknown receipts never imply a successful transfer. */
export const mockGateway: PaymentGateway = {
  name: "mock",
  capabilities: { refund: true, payout: true },
  async execute(input) {
    validateMoneyRequest(input);
    const fingerprint = JSON.stringify(input);
    const previous = mockReceipts.get(input.idempotencyKey);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new Error("รหัสรายการเดิมมีข้อมูลไม่ตรงกัน");
      return previous.result;
    }
    const result: GatewayResult = {
      status: "SUCCEEDED",
      reference: `mock_${createHash("sha256").update(input.idempotencyKey).digest("hex").slice(0, 32)}`,
    };
    mockReceipts.set(input.idempotencyKey, { fingerprint, result });
    return result;
  },
  async retrieve(input) {
    validateMoneyRequest(input);
    const previous = mockReceipts.get(input.idempotencyKey);
    if (!previous) return {status:"UNKNOWN",reference:"",error:"ไม่พบผลทดสอบเดิมในรอบเซิร์ฟเวอร์นี้ กรุณาตรวจสอบรายการ"};
    if (previous.fingerprint !== JSON.stringify(input)) throw new Error("ข้อมูลรายการเดิมไม่ตรงกัน");
    return previous.result;
  },
};

/** Production fails closed until a reviewed provider adapter is configured. */
export const unconfiguredGateway: PaymentGateway = {
  name: "unconfigured",
  capabilities: { refund: false, payout: false },
  async execute() {
    return { status: "FAILED", reference: "", error: "ยังไม่ได้เชื่อมต่อผู้ให้บริการชำระเงิน" };
  },
  async retrieve() {
    return { status: "UNKNOWN", reference: "", error: "ยังไม่ได้เชื่อมต่อผู้ให้บริการชำระเงิน" };
  },
};
