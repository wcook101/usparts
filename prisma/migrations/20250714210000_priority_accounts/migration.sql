-- CreateEnum
CREATE TYPE "PriorityAccountStatus" AS ENUM ('NEEDS_RESEARCH', 'RESEARCHING', 'EMAIL_FOUND', 'READY_TO_CONTACT', 'CONTACTED', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "PriorityAccount" (
    "id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "decisionMakerName" TEXT,
    "decisionMakerTitle" TEXT,
    "decisionMakerEmail" TEXT,
    "phone" TEXT,
    "linkedInUrl" TEXT,
    "researchNotes" TEXT,
    "status" "PriorityAccountStatus" NOT NULL DEFAULT 'NEEDS_RESEARCH',
    "lastResearchedAt" TIMESTAMP(3),
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriorityAccount_rank_key" ON "PriorityAccount"("rank");

-- CreateIndex
CREATE INDEX "PriorityAccount_status_idx" ON "PriorityAccount"("status");

-- CreateIndex
CREATE INDEX "PriorityAccount_decisionMakerEmail_idx" ON "PriorityAccount"("decisionMakerEmail");

-- CreateIndex
CREATE INDEX "PriorityAccount_companyName_idx" ON "PriorityAccount"("companyName");

-- AddForeignKey
ALTER TABLE "PriorityAccount" ADD CONSTRAINT "PriorityAccount_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
