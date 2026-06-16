import type {
  Company,
  CompanyMember,
  CompanyMemberRole,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getEmailDomain } from "@/lib/email-domain";
import { findOwnedCompany } from "@/lib/auth/ownership";

export type CompanyMembership = CompanyMember & {
  company: Company;
};

export const SUPPLIER_ROLES: CompanyMemberRole[] = ["OWNER", "ADMIN"];

export function canManageInventory(role: CompanyMemberRole): boolean {
  return SUPPLIER_ROLES.includes(role);
}

export function canInviteMembers(role: CompanyMemberRole): boolean {
  return role === "OWNER";
}

export async function findMembershipForUser(
  userId: string,
): Promise<CompanyMembership | null> {
  return db.companyMember.findFirst({
    where: { userId },
    include: { company: true },
  });
}

export async function ensureOwnerMembership(
  userId: string,
  company: Company,
): Promise<CompanyMembership> {
  const existing = await db.companyMember.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId: company.id,
      },
    },
    include: { company: true },
  });

  if (existing) {
    if (existing.role !== "OWNER") {
      return db.companyMember.update({
        where: { id: existing.id },
        data: { role: "OWNER" },
        include: { company: true },
      });
    }

    return existing;
  }

  return db.companyMember.create({
    data: {
      userId,
      companyId: company.id,
      role: "OWNER",
    },
    include: { company: true },
  });
}

export async function resolveCompanyMembership(
  userId: string,
  ownedCompany: Company | null,
): Promise<CompanyMembership | null> {
  if (ownedCompany) {
    return ensureOwnerMembership(userId, ownedCompany);
  }

  return findMembershipForUser(userId);
}

export async function getCompanyAccess(userId: string): Promise<{
  company: Company;
  role: CompanyMemberRole;
} | null> {
  const owned = await findOwnedCompany(userId);
  if (owned) {
    return { company: owned, role: "OWNER" };
  }

  const membership = await findMembershipForUser(userId);
  if (!membership) {
    return null;
  }

  return {
    company: membership.company,
    role: membership.role,
  };
}

export async function ensureCompanyEmailDomain(
  companyId: string,
  email: string,
): Promise<void> {
  const domain = getEmailDomain(email);
  if (!domain) {
    return;
  }

  await db.company.update({
    where: { id: companyId },
    data: { emailDomain: domain },
  });
}
