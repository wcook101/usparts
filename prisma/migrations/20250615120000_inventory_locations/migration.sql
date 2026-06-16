-- CreateTable
CREATE TABLE "InventoryLocation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);

-- Backfill inventory locations from existing company addresses
INSERT INTO "InventoryLocation" ("id", "companyId", "label", "city", "state", "country", "createdAt", "updatedAt")
SELECT
    'loc_' || "id",
    "id",
    'Main warehouse',
    COALESCE(NULLIF("city", ''), 'United States'),
    "state",
    "country",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Company";

-- Add optional listing description and inventory location link
ALTER TABLE "PartListing" ADD COLUMN "inventoryLocationId" TEXT;
ALTER TABLE "PartListing" ALTER COLUMN "description" DROP NOT NULL;

-- Link listings to company inventory locations
UPDATE "PartListing" AS listing
SET "inventoryLocationId" = location."id"
FROM "InventoryLocation" AS location
WHERE listing."companyId" = location."companyId"
  AND location."label" = 'Main warehouse';

ALTER TABLE "PartListing" DROP COLUMN IF EXISTS "location";

-- CreateIndex
CREATE INDEX "InventoryLocation_companyId_idx" ON "InventoryLocation"("companyId");
CREATE INDEX "PartListing_inventoryLocationId_idx" ON "PartListing"("inventoryLocationId");

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartListing" ADD CONSTRAINT "PartListing_inventoryLocationId_fkey" FOREIGN KEY ("inventoryLocationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
