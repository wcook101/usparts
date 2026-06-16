-- AlterTable
ALTER TABLE "Order" ADD COLUMN "accessToken" TEXT;

UPDATE "Order" SET "accessToken" = 'o' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 24) WHERE "accessToken" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "accessToken" SET NOT NULL;

-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN "accessToken" TEXT;

UPDATE "QuoteRequest" SET "accessToken" = 'q' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 24) WHERE "accessToken" IS NULL;

ALTER TABLE "QuoteRequest" ALTER COLUMN "accessToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_accessToken_key" ON "QuoteRequest"("accessToken");
