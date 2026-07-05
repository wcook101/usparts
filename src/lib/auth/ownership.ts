import type { Company } from "@/generated/prisma/client";
import { isPlatformAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { ensureCompanyEmailDomain, ensureOwnerMembership } from "@/lib/auth/membership";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findOwnedCompany(userId: string): Promise<Company | null> {
  return db.company.findUnique({
    where: { ownerId: userId },
  });
}

async function linkCompanyToOwner(
  userId: string,
  company: Company,
): Promise<Company> {
  const updated = await db.company.update({
    where: { id: company.id },
    data: { ownerId: userId },
  });

  await ensureCompanyEmailDomain(updated.id, updated.email);
  await ensureOwnerMembership(userId, updated);

  return updated;
}

export async function detachPlatformAdminSupplierIdentity(
  userId: string,
  email: string,
): Promise<void> {
  if (!isPlatformAdmin(email)) {
    return;
  }

  const owned = await findOwnedCompany(userId);
  if (!owned) {
    return;
  }

  await db.$transaction(async (tx) => {
    await tx.company.update({
      where: { id: owned.id },
      data: { ownerId: null },
    });
    await tx.companyMember.deleteMany({
      where: {
        userId,
        companyId: owned.id,
      },
    });
  });
}

export async function linkUnownedCompanyByEmail(
  userId: string,
  email: string,
): Promise<Company | null> {
  if (isPlatformAdmin(email)) {
    return null;
  }

  const owned = await findOwnedCompany(userId);
  if (owned) {
    await ensureOwnerMembership(userId, owned);
    return owned;
  }

  const unowned = await db.company.findFirst({
    where: {
      ownerId: null,
      email: { equals: normalizeEmail(email), mode: "insensitive" },
    },
  });

  if (!unowned) {
    return null;
  }

  return linkCompanyToOwner(userId, unowned);
}

export async function claimCompanyForUser(
  userId: string,
  email: string,
  companyId: string,
): Promise<Company | null> {
  if (isPlatformAdmin(email)) {
    return null;
  }

  const owned = await findOwnedCompany(userId);
  if (owned) {
    return owned.id === companyId ? owned : null;
  }

  const company = await db.company.findUnique({
    where: { id: companyId },
  });

  if (!company || company.ownerId) {
    return null;
  }

  if (normalizeEmail(company.email) !== normalizeEmail(email)) {
    return null;
  }

  return linkCompanyToOwner(userId, company);
}
