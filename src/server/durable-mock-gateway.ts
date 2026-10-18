import "server-only";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { validateMoneyRequest, type GatewayRequest, type PaymentGateway } from "./payment-gateway";

function fingerprint(input: GatewayRequest) {
  return createHash("sha256").update(JSON.stringify([
    input.kind, input.amountMinor, input.currency, input.idempotencyKey,
    input.reference, input.method ?? null, input.originalReference ?? null,
  ])).digest("hex");
}

/** Staging-only provider receipts persist independently of local payment finalization. */
export const durableMockGateway: PaymentGateway = {
  name: "mock",
  capabilities: { refund: true, payout: true },
  async execute(input) {
    validateMoneyRequest(input);
    const hash = fingerprint(input);
    let receipt;
    try {
      receipt = await db.mockGatewayReceipt.create({ data: {
        key: input.idempotencyKey, fingerprint: hash,
        reference: `mock_${createHash("sha256").update(input.idempotencyKey).digest("hex").slice(0, 32)}`,
      } });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      // Another process may have committed the same key while this request was creating it.
      receipt = await db.mockGatewayReceipt.findUniqueOrThrow({ where: { key: input.idempotencyKey } });
    }
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
