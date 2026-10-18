CREATE TABLE "RefundCase" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_DETAILS',
    "version" INTEGER NOT NULL DEFAULT 0,
    "destination" TEXT NOT NULL DEFAULT '',
    "transferReference" TEXT,
    "evidence" TEXT NOT NULL DEFAULT '',
    "verification" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RefundCase_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RefundCase_positive_amount" CHECK ("amountMinor" > 0),
    CONSTRAINT "RefundCase_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "MoneyOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RefundCase_operationId_key" ON "RefundCase"("operationId");
CREATE UNIQUE INDEX "RefundCase_transferReference_key" ON "RefundCase"("transferReference");
CREATE TABLE "RefundCaseEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefundCaseEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RefundCaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "RefundCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "RefundCaseEvent_caseId_createdAt_idx" ON "RefundCaseEvent"("caseId", "createdAt");
