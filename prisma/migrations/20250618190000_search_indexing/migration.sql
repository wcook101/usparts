-- Enable trigram indexes for fast ILIKE / fuzzy text search on large catalogs.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "PartListing" ADD COLUMN "mpnNormalized" TEXT;

UPDATE "PartListing"
SET "mpnNormalized" = UPPER(REGEXP_REPLACE("mpn", '[^a-zA-Z0-9]', '', 'g'));

ALTER TABLE "PartListing" ALTER COLUMN "mpnNormalized" SET NOT NULL;

CREATE INDEX "PartListing_mpnNormalized_idx" ON "PartListing"("mpnNormalized");
CREATE INDEX "PartListing_isActive_mpnNormalized_idx" ON "PartListing"("isActive", "mpnNormalized");
CREATE INDEX "PartListing_mpn_trgm_idx" ON "PartListing" USING gin ("mpn" gin_trgm_ops);
CREATE INDEX "PartListing_manufacturer_trgm_idx" ON "PartListing" USING gin ("manufacturer" gin_trgm_ops);
CREATE INDEX "PartListing_description_trgm_idx" ON "PartListing" USING gin ("description" gin_trgm_ops);
