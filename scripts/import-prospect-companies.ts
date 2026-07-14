import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSupplierOutreach } from "@/lib/supplier-outreach";
import { db } from "@/lib/db";

type ProspectEntry = {
  companyName: string;
  website?: string | null;
  notes?: string | null;
};

function normalizeWebsite(website: string | null | undefined): string | null {
  if (!website?.trim()) {
    return null;
  }

  const trimmed = website.trim().replace(/^https?:\/\//i, "");
  if (trimmed.includes(".")) {
    return trimmed;
  }

  return `${trimmed}.com`;
}

function loadProspects(): ProspectEntry[] {
  const dataPath = join(process.cwd(), "scripts/data/prospect-companies.json");
  const raw = readFileSync(dataPath, "utf8");
  return JSON.parse(raw) as ProspectEntry[];
}

async function resolveAdminUser() {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length > 0) {
    const admin = await db.user.findFirst({
      where: {
        email: { in: adminEmails, mode: "insensitive" },
      },
      select: { id: true, email: true },
      orderBy: { createdAt: "asc" },
    });

    if (admin) {
      return admin;
    }
  }

  const fallback = await db.user.findFirst({
    select: { id: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  if (!fallback) {
    throw new Error("No user account found to attach outreach records.");
  }

  return fallback;
}

async function main() {
  const admin = await resolveAdminUser();
  const prospects = loadProspects();

  console.log(`Using admin: ${admin.email}`);
  console.log(`Loaded ${prospects.length} prospects.`);

  const existing = await db.supplierOutreach.findMany({
    select: { companyName: true },
  });
  const existingNames = new Set(
    existing.map((row) => row.companyName.trim().toLowerCase()),
  );

  let created = 0;
  let skipped = 0;

  for (const entry of prospects) {
    const key = entry.companyName.trim().toLowerCase();
    if (existingNames.has(key)) {
      console.log(`Skip (already tracked): ${entry.companyName}`);
      skipped += 1;
      continue;
    }

    const record = await createSupplierOutreach({
      companyName: entry.companyName.trim(),
      contactEmail: null,
      website: normalizeWebsite(entry.website),
      contactedAt: new Date(),
      notes:
        entry.notes ??
        "Imported prospect list (Jul 2026). Distributor / supplier outreach candidate.",
      addedById: admin.id,
    });

    existingNames.add(key);
    console.log(`Added: ${record.companyName}${record.website ? ` (${record.website})` : ""}`);
    created += 1;
  }

  console.log(`Done. Created ${created}, skipped ${skipped}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
