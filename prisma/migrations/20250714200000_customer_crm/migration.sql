-- CreateEnum
CREATE TYPE "CustomerCrmStatus" AS ENUM ('LEAD', 'CONTACTED', 'NURTURING', 'SIGNED_UP', 'ACTIVE', 'LOST', 'ARCHIVED');

-- CreateTable
CREATE TABLE "CustomerLead" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "companyName" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "status" "CustomerCrmStatus" NOT NULL DEFAULT 'LEAD',
    "contactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastFollowUpAt" TIMESTAMP(3),
    "lastEmailedAt" TIMESTAMP(3),
    "emailCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "userId" TEXT,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerLead_userId_key" ON "CustomerLead"("userId");

-- CreateIndex
CREATE INDEX "CustomerLead_status_idx" ON "CustomerLead"("status");

-- CreateIndex
CREATE INDEX "CustomerLead_email_idx" ON "CustomerLead"("email");

-- CreateIndex
CREATE INDEX "CustomerLead_contactedAt_idx" ON "CustomerLead"("contactedAt");

-- CreateIndex
CREATE INDEX "CustomerLead_addedById_idx" ON "CustomerLead"("addedById");

-- AddForeignKey
ALTER TABLE "CustomerLead" ADD CONSTRAINT "CustomerLead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerLead" ADD CONSTRAINT "CustomerLead_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
