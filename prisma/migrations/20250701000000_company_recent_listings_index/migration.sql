-- Speed up per-company recent listing queries on large catalogs.
CREATE INDEX "PartListing_companyId_isActive_updatedAt_idx"
ON "PartListing"("companyId", "isActive", "updatedAt" DESC);
