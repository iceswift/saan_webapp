CREATE TABLE "PaymentPool" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "accountId" TEXT NOT NULL DEFAULT '',
 "revision" INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE "PayoutAttempt" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "operationId" TEXT NOT NULL,
 "accountId" TEXT NOT NULL,
 "recipientId" TEXT NOT NULL,
 "destinationHash" TEXT NOT NULL,
 "grossMinor" INTEGER NOT NULL,
 "collectionFeeMinor" INTEGER NOT NULL,
 "policy" TEXT NOT NULL,
 "transferFeeMinor" INTEGER,
 "bankNetMinor" INTEGER,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PayoutAttempt_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "MoneyOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "PayoutAttempt_amounts" CHECK ("grossMinor" > 0 AND "collectionFeeMinor" >= 0 AND "collectionFeeMinor" < "grossMinor")
);
CREATE UNIQUE INDEX "PayoutAttempt_operationId_key" ON "PayoutAttempt"("operationId");
