-- CreateTable
CREATE TABLE "MockGatewayReceipt" (
    "key" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockGatewayReceipt_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "MockGatewayReceipt_reference_key" ON "MockGatewayReceipt"("reference");
