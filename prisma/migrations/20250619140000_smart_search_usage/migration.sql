-- CreateTable
CREATE TABLE "SmartSearchUsageMonth" (
    "id" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "apiRequestCount" INTEGER NOT NULL DEFAULT 0,
    "cachedHitCount" INTEGER NOT NULL DEFAULT 0,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartSearchUsageMonth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmartSearchUsageMonth_monthKey_key" ON "SmartSearchUsageMonth"("monthKey");
