import "server-only";
import { createHash } from "node:crypto";
import { db } from "./db";
import { validateMoneyRequest, type GatewayRequest, type PaymentGateway } from "./payment-gateway";

function fingerprint(input: GatewayRequest) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

/** Staging-only provider receipts persist independently of local payment finalization. */
export const durableMockGateway: PaymentGateway = {
  name: "mock",
  async execute(input) {
    validateMoneyRequest(input);
    const hash = fingerprint(input);
    const receipt = await db.mockGatewayReceipt.upsert({
      where: { key: input.idempotencyKey }, update: {},
      create: {
        key: input.idempotencyKey, fingerprint: hash,
        reference: `mock_${createHash("sha256").update(input.idempotencyKey).digest("hex").slice(0, 32)}`,
      },
    });
    if (receipt.fingerprint !== hash) throw new Error("รหัสรายการเดิมมีข้อมูลไม่ตรงกัน");
    return { status: "SUCCEEDED", reference: receipt.reference };
  },
  async retrieve(input) {
    validateMoneyRequest(input);
    const receipt = await db.mockGatewayReceipt.findUnique({ where: { key: input.idempotencyKey } });
    if (!receipt) return { status: "UNKNOWN", reference: "", error: "ไม่พบผลการชำระเงินจำลองเดิม" };
    if (receipt.fingerprint !== fingerprint(input)) throw new Error("ข้อมูลรายการเดิมไม่ตรงกัน");
    return { status: "SUCCEEDED", reference: receipt.reference };
  },
};
