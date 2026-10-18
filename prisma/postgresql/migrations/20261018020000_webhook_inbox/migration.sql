CREATE TABLE "ProviderWebhookEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "chargeId" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "receivedAt" TEXT NOT NULL,
  "nextAttemptAt" TEXT NOT NULL,
  "leaseUntil" TEXT NOT NULL DEFAULT '',
  "leaseToken" TEXT NOT NULL DEFAULT '',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "processedAt" TEXT,
  "error" TEXT NOT NULL DEFAULT ''
);
CREATE INDEX "ProviderWebhookEvent_processedAt_nextAttemptAt_idx"
  ON "ProviderWebhookEvent"("processedAt", "nextAttemptAt");
