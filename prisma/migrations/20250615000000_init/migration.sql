-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PartCondition" AS ENUM ('NEW', 'REFURBISHED', 'USED');

-- CreateEnum
CREATE TYPE "PartCategory" AS ENUM ('SEMICONDUCTOR', 'PASSIVE', 'CONNECTOR', 'INTEGRATED_CIRCUIT', 'POWER', 'SENSOR', 'MEMORY', 'DISPLAY', 'RF_WIRELESS', 'OTHER');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartListing" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mpn" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "PartCategory" NOT NULL DEFAULT 'OTHER',
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(12,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "condition" "PartCondition" NOT NULL DEFAULT 'NEW',
    "leadTimeDays" INTEGER,
    "location" TEXT,
    "datasheetUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "PartListing_mpn_idx" ON "PartListing"("mpn");

-- CreateIndex
CREATE INDEX "PartListing_manufacturer_idx" ON "PartListing"("manufacturer");

-- CreateIndex
CREATE INDEX "PartListing_category_idx" ON "PartListing"("category");

-- CreateIndex
CREATE INDEX "PartListing_isActive_idx" ON "PartListing"("isActive");

-- CreateIndex
CREATE INDEX "PartListing_mpn_manufacturer_idx" ON "PartListing"("mpn", "manufacturer");

-- AddForeignKey
ALTER TABLE "PartListing" ADD CONSTRAINT "PartListing_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
