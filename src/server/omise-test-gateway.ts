import "server-only";
import { createOmiseTestClient, type TestCharge } from "./omise-test-client";
import type { GatewayResult, PaymentGateway } from "./payment-gateway";

function outcome(charge: TestCharge): GatewayResult {
  if (charge.status === "successful" && charge.paid) return { status: "SUCCEEDED", reference: charge.id };
  const qr = charge.source.scannable_code?.image.download_uri;
  if (charge.status === "pending" && qr && charge.expires_at) {
    const url = new URL(qr);
    if (url.origin !== "https://api.omise.co" || !url.pathname.startsWith(`/charges/${charge.id}/documents/`)) {
      return { status: "UNKNOWN", reference: charge.id };
    }
    return { status: "PENDING", reference: charge.id,
      nextAction: { status: "PENDING", qrUrl: qr, expiresAt: charge.expires_at } };
  }
  return { status: charge.status === "pending" ? "UNKNOWN" : "FAILED", reference: charge.id,
    error: "รายการหมดอายุหรือไม่สำเร็จ กรุณาติดต่อทีมงานเพื่อตรวจสอบ" };
}

/** Collection only: refund and shop transfer capabilities deliberately fail closed. */
export function createOmiseTestGateway(getClient: () => ReturnType<typeof createOmiseTestClient> = createOmiseTestClient): PaymentGateway {
return {
  name: "omise_test",
  async execute(input) {
    if (!["PAYMENT_DEPOSIT", "PAYMENT_BALANCE"].includes(input.kind) || input.method !== "PROMPTPAY") {
      return { status: "FAILED", reference: "", error: "ช่องทางนี้ยังไม่รองรับรายการดังกล่าว" };
    }
    const charge = await getClient().createPromptPay(
      { amountMinor: input.amountMinor, reference: input.idempotencyKey },
      new Date(Date.now() + 900_000).toISOString(),
    );
    return outcome(charge);
  },
  async retrieve(input) {
    if (!["PAYMENT_DEPOSIT", "PAYMENT_BALANCE"].includes(input.kind) || !input.gatewayReference) {
      return { status: "UNKNOWN", reference: "", error: "ต้องตรวจสอบรายการเดิมกับทีมงาน" };
    }
    return outcome(await getClient().retrievePromptPay({ amountMinor: input.amountMinor,
      reference: input.idempotencyKey, chargeId: input.gatewayReference }));
  },
};
}

export const omiseTestGateway = createOmiseTestGateway();
