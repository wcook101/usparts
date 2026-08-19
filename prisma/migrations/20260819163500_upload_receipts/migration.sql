-- CreateEnum
CREATE TYPE "UploadReceiptStatus" AS ENUM ('SENT', 'SKIPPED', 'FAILED');

-- CreateTable
CREATE TABLE "UploadReceipt" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "recipients" TEXT[],
    "status" "UploadReceiptStatus" NOT NULL,
    "message" TEXT NOT NULL,
    "createdCount" INTEGER NOT NULL,
    "updatedCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadReceipt_createdAt_idx" ON "UploadReceipt"("createdAt");

-- CreateIndex
CREATE INDEX "UploadReceipt_companyId_idx" ON "UploadReceipt"("companyId");

-- CreateIndex
CREATE INDEX "UploadReceipt_status_idx" ON "UploadReceipt"("status");

-- AddForeignKey
ALTER TABLE "UploadReceipt" ADD CONSTRAINT "UploadReceipt_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
