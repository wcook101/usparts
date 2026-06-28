-- CreateEnum
CREATE TYPE "SupplierOutreachStatus" AS ENUM ('CONTACTED', 'FOLLOW_UP', 'REGISTERED', 'INVENTORY_LIVE', 'DECLINED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "SupplierOutreach" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "website" TEXT,
    "status" "SupplierOutreachStatus" NOT NULL DEFAULT 'CONTACTED',
    "contactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastFollowUpAt" TIMESTAMP(3),
    "notes" TEXT,
    "companyId" TEXT,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierOutreach_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierOutreach_companyId_key" ON "SupplierOutreach"("companyId");

-- CreateIndex
CREATE INDEX "SupplierOutreach_status_idx" ON "SupplierOutreach"("status");

-- CreateIndex
CREATE INDEX "SupplierOutreach_contactedAt_idx" ON "SupplierOutreach"("contactedAt");

-- CreateIndex
CREATE INDEX "SupplierOutreach_contactEmail_idx" ON "SupplierOutreach"("contactEmail");

-- CreateIndex
CREATE INDEX "SupplierOutreach_addedById_idx" ON "SupplierOutreach"("addedById");

-- AddForeignKey
ALTER TABLE "SupplierOutreach" ADD CONSTRAINT "SupplierOutreach_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOutreach" ADD CONSTRAINT "SupplierOutreach_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
