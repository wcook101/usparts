-- Backfill listings missing an inventory location with the company's first warehouse
UPDATE "PartListing" AS pl
SET "inventoryLocationId" = il."id"
FROM (
  SELECT DISTINCT ON ("companyId") "id", "companyId"
  FROM "InventoryLocation"
  ORDER BY "companyId", "createdAt" ASC
) AS il
WHERE pl."inventoryLocationId" IS NULL
  AND pl."companyId" = il."companyId";

-- Remove listings that cannot be assigned a warehouse (should not occur in normal data)
DELETE FROM "PartListing" WHERE "inventoryLocationId" IS NULL;

ALTER TABLE "PartListing" DROP CONSTRAINT "PartListing_inventoryLocationId_fkey";
ALTER TABLE "PartListing" ALTER COLUMN "inventoryLocationId" SET NOT NULL;
ALTER TABLE "PartListing" ADD CONSTRAINT "PartListing_inventoryLocationId_fkey" FOREIGN KEY ("inventoryLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
