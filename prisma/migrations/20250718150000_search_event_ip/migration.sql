-- AlterTable
ALTER TABLE "SearchEvent" ADD COLUMN "ipAddress" TEXT;

-- CreateIndex
CREATE INDEX "SearchEvent_ipAddress_idx" ON "SearchEvent"("ipAddress");
