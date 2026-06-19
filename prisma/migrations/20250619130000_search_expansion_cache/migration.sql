-- CreateTable
CREATE TABLE "SearchExpansionCache" (
    "id" TEXT NOT NULL,
    "queryKey" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "suggestedMpns" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchExpansionCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchExpansionCache_queryKey_key" ON "SearchExpansionCache"("queryKey");

-- CreateIndex
CREATE INDEX "SearchExpansionCache_expiresAt_idx" ON "SearchExpansionCache"("expiresAt");
