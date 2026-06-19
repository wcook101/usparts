-- Store per-line requested quantities for bulk RFQ jobs
ALTER TABLE "BulkRfqJob" ADD COLUMN "listingItems" JSONB;
