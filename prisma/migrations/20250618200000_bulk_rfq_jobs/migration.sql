-- CreateEnum
CREATE TYPE "BulkRfqJobStatus" AS ENUM ('PENDING', 'SENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "BulkRfqJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerCompany" TEXT,
    "notes" TEXT,
    "listingIds" TEXT[],
    "status" "BulkRfqJobStatus" NOT NULL DEFAULT 'PENDING',
    "totalListings" INTEGER NOT NULL,
    "totalVendors" INTEGER NOT NULL,
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkRfqJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BulkRfqJob_buyerEmail_idx" ON "BulkRfqJob"("buyerEmail");

-- CreateIndex
CREATE INDEX "BulkRfqJob_status_idx" ON "BulkRfqJob"("status");

-- CreateIndex
CREATE INDEX "BulkRfqJob_createdAt_idx" ON "BulkRfqJob"("createdAt");

-- AddForeignKey
ALTER TABLE "BulkRfqJob" ADD CONSTRAINT "BulkRfqJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
