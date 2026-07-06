-- CreateEnum
CREATE TYPE "DatasheetSource" AS ENUM ('LISTING', 'MANUFACTURER', 'NEXAR', 'MANUAL');

-- CreateTable
CREATE TABLE "PartDatasheet" (
    "id" TEXT NOT NULL,
    "mpnNormalized" TEXT NOT NULL,
    "mpn" TEXT NOT NULL,
    "manufacturer" TEXT,
    "datasheetUrl" TEXT NOT NULL,
    "source" "DatasheetSource" NOT NULL DEFAULT 'LISTING',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartDatasheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartDatasheet_mpnNormalized_key" ON "PartDatasheet"("mpnNormalized");

-- CreateIndex
CREATE INDEX "PartDatasheet_mpnNormalized_idx" ON "PartDatasheet"("mpnNormalized");
