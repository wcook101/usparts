import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSupplierOutreach } from "@/lib/supplier-outreach";
import { db } from "@/lib/db";

type OutreachEmailEntry = {
  companyName: string;
  contactEmail: string;
  website?: string | null;
  contactedAt: string;
  notes?: string | null;
};

function loadOutreachEmails(): OutreachEmailEntry[] {
  const dataPath = join(process.cwd(), "scripts/data/outreach-emails.json");
  const raw = readFileSync(dataPath, "utf8");
  return JSON.parse(raw) as OutreachEmailEntry[];
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
  const outreachEmails = loadOutreachEmails();

  console.log(`Using admin: ${admin.email}`);
  console.log(`Loaded ${outreachEmails.length} outreach entries from JSON.`);

  const existing = await db.supplierOutreach.findMany({
    select: { contactEmail: true },
  });
  const existingEmails = new Set(
    existing
      .map((row) => row.contactEmail?.trim().toLowerCase())
      .filter(Boolean),
  );

  let created = 0;
  let skipped = 0;

  for (const entry of outreachEmails) {
    const normalizedEmail = entry.contactEmail.trim().toLowerCase();
    if (existingEmails.has(normalizedEmail)) {
      console.log(`Skip (already tracked): ${entry.contactEmail}`);
      skipped += 1;
      continue;
    }

    const record = await createSupplierOutreach({
      companyName: entry.companyName,
      contactEmail: entry.contactEmail,
      website: entry.website ?? null,
      contactedAt: new Date(entry.contactedAt),
      notes: entry.notes ?? null,
      addedById: admin.id,
    });

    existingEmails.add(normalizedEmail);
    console.log(`Added: ${record.companyName} <${record.contactEmail}>`);
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
