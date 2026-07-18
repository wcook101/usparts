-- CreateEnum
CREATE TYPE "SearchIntelDimension" AS ENUM (
  'PART',
  'MANUFACTURER',
  'CATEGORY',
  'ZERO_RESULT_PART',
  'MILITARY_PART',
  'SUPPLIER_RFQ',
  'RFQ_BY_MANUFACTURER',
  'HUMAN_QUERY',
  'BOT_QUERY'
);

-- CreateTable
CREATE TABLE "SearchIntelDay" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "searchesTotal" INTEGER NOT NULL DEFAULT 0,
    "searchesHuman" INTEGER NOT NULL DEFAULT 0,
    "searchesBot" INTEGER NOT NULL DEFAULT 0,
    "searchesUnclassified" INTEGER NOT NULL DEFAULT 0,
    "searchesSingleHuman" INTEGER NOT NULL DEFAULT 0,
    "searchesBulkHuman" INTEGER NOT NULL DEFAULT 0,
    "searchesSmartHuman" INTEGER NOT NULL DEFAULT 0,
    "zeroResultHuman" INTEGER NOT NULL DEFAULT 0,
    "rfqsSubmitted" INTEGER NOT NULL DEFAULT 0,
    "humanSearchConversion" DECIMAL(8,6),
    "builtAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchIntelDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchIntelRank" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "dimension" "SearchIntelDimension" NOT NULL,
    "rank" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "humanCount" INTEGER NOT NULL DEFAULT 0,
    "botCount" INTEGER NOT NULL DEFAULT 0,
    "zeroResultCount" INTEGER NOT NULL DEFAULT 0,
    "rfqCount" INTEGER NOT NULL DEFAULT 0,
    "listingCount" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,

    CONSTRAINT "SearchIntelRank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchIntelDay_day_key" ON "SearchIntelDay"("day");

-- CreateIndex
CREATE INDEX "SearchIntelDay_day_idx" ON "SearchIntelDay"("day");

-- CreateIndex
CREATE UNIQUE INDEX "SearchIntelRank_day_dimension_key_key" ON "SearchIntelRank"("day", "dimension", "key");

-- CreateIndex
CREATE INDEX "SearchIntelRank_day_dimension_rank_idx" ON "SearchIntelRank"("day", "dimension", "rank");

-- CreateIndex
CREATE INDEX "SearchIntelRank_dimension_key_idx" ON "SearchIntelRank"("dimension", "key");
