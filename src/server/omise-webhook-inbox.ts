import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { payments } from "./integrations";
import { reconcileCustomerPaymentOperation } from "./payment-service";
import type { PaymentGateway } from "./payment-gateway";

const eventSchema = z.object({ object: z.literal("event"), id: z.string().regex(/^evnt_test_[a-z0-9]+$/),
  livemode: z.literal(false), key: z.enum(["charge.create", "charge.complete", "charge.update"]),
  data: z.object({ object: z.literal("charge"), id: z.string().regex(/^chrg_test_[a-z0-9]+$/), livemode: z.literal(false) }),
});
type InboxEvent = { id: string; chargeId: string; attempts: number };

/** Called only after raw-byte signature verification. No untrusted status/amount is stored. */
export async function storeOmiseEvent(body: Uint8Array): Promise<"STORED" | "IGNORED"> {
  const parsed = eventSchema.safeParse(JSON.parse(Buffer.from(body).toString("utf8")));
  if (!parsed.success) return "IGNORED";
  const event = parsed.data;
  const hash = createHash("sha256").update(body).digest("hex");
  const now = new Date().toISOString();
  // Parameterized SQL keeps this additive model usable before generated client deployment.
  await db.$executeRaw`INSERT INTO "ProviderWebhookEvent"
    ("id", "chargeId", "payloadHash", "receivedAt", "nextAttemptAt")
    VALUES (${event.id}, ${event.data.id}, ${hash}, ${now}, ${now}) ON CONFLICT ("id") DO NOTHING`;
  const rows = await db.$queryRaw<{ chargeId: string; payloadHash: string }[]>`
    SELECT "chargeId", "payloadHash" FROM "ProviderWebhookEvent" WHERE "id" = ${event.id}`;
  if (rows[0]?.chargeId !== event.data.id || rows[0]?.payloadHash !== hash) throw new Error("Webhook identity conflict");
  return "STORED";
}

/** Read-only provider requests; no execute, refund or transfer path exists in this worker. */
export async function reconcileOmiseBatch(gateway: PaymentGateway = payments) {
  if (gateway.name !== "omise_test") return { processed: 0, checked: 0 };
  const now = new Date();
  const until = new Date(now.getTime() + 120_000).toISOString();
  const due = await db.$queryRaw<InboxEvent[]>`SELECT "id", "chargeId", "attempts"
    FROM "ProviderWebhookEvent" WHERE "processedAt" IS NULL AND "nextAttemptAt" <= ${now.toISOString()}
    AND "leaseUntil" < ${now.toISOString()} ORDER BY "receivedAt" LIMIT 5`;
  let processed = 0;
  for (const event of due) {
    const token = randomUUID();
    const claimed = await db.$executeRaw`UPDATE "ProviderWebhookEvent" SET "leaseUntil" = ${until},
      "leaseToken" = ${token}, "attempts" = "attempts" + 1
      WHERE "id" = ${event.id} AND "processedAt" IS NULL AND "leaseUntil" < ${now.toISOString()}`;
    if (!claimed) continue;
    try {
      const operation = await db.moneyOperation.findFirst({ where: { gateway: "omise_test", gatewayRef: event.chargeId,
        kind: { in: ["PAYMENT_DEPOSIT", "PAYMENT_BALANCE"] } } });
      if (!operation) throw new Error("Unmapped charge; retry after creation persistence");
      const result = await reconcileCustomerPaymentOperation(operation.id, gateway);
      const current = await db.moneyOperation.findUniqueOrThrow({ where: { id: operation.id } });
      if (!result.ok && current.status !== "SUCCEEDED") throw new Error("Provider confirmation pending");
      await db.$executeRaw`UPDATE "ProviderWebhookEvent" SET "processedAt" = ${new Date().toISOString()},
        "error" = '', "leaseUntil" = '', "leaseToken" = '' WHERE "id" = ${event.id} AND "leaseToken" = ${token}`;
      processed++;
    } catch {
      const delay = Math.min(3600, 15 * 2 ** Math.min(event.attempts, 8));
      const retryAt = new Date(Date.now() + delay * 1000).toISOString();
      await db.$executeRaw`UPDATE "ProviderWebhookEvent" SET "nextAttemptAt" = ${retryAt},
        "error" = 'Requires reconciliation', "leaseUntil" = '', "leaseToken" = ''
        WHERE "id" = ${event.id} AND "leaseToken" = ${token}`;
    }
  }
  // Polling covers callbacks that never arrive, and never creates replacement charges.
  const candidates = await db.moneyOperation.findMany({ where: { gateway: "omise_test",
    kind: { in: ["PAYMENT_DEPOSIT", "PAYMENT_BALANCE"] }, status: { in: ["PENDING", "UNKNOWN", "PROCESSING"] },
    gatewayRef: { not: "" }, updatedAt: { lt: new Date(Date.now() - 60_000) } },
    orderBy: { updatedAt: "asc" }, take: 5 });
  let checked = 0;
  for (const candidate of candidates) {
    try { await reconcileCustomerPaymentOperation(candidate.id, gateway); checked++; } catch { /* Next bounded poll retries. */ }
  }
  return { processed, checked };
}
