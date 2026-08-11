-- CreateTable
CREATE TABLE "IpIntel" (
    "ip" TEXT NOT NULL,
    "countryCode" TEXT,
    "countryName" TEXT,
    "continent" TEXT,
    "region" TEXT,
    "city" TEXT,
    "asn" INTEGER,
    "asnName" TEXT,
    "asnDomain" TEXT,
    "registry" TEXT,
    "hostname" TEXT,
    "orgName" TEXT,
    "orgDomain" TEXT,
    "isHosting" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "lookupError" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IpIntel_pkey" PRIMARY KEY ("ip")
);

-- CreateIndex
CREATE INDEX "IpIntel_countryCode_idx" ON "IpIntel"("countryCode");

-- CreateIndex
CREATE INDEX "IpIntel_asn_idx" ON "IpIntel"("asn");

-- CreateIndex
CREATE INDEX "IpIntel_checkedAt_idx" ON "IpIntel"("checkedAt");
