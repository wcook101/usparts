import type { CompanyMemberRole } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/auth/session";
import { canManageInventory } from "@/lib/auth/membership";
import { normalizeEmail } from "@/lib/auth/ownership";

export function getSessionCompany(user: SessionUser | null) {
  if (!user) {
    return null;
  }

  return user.membership?.company ?? user.company;
}

export function getSessionRole(
  user: SessionUser | null,
): CompanyMemberRole | null {
  if (!user) {
    return null;
  }

  return user.membership?.role ?? (user.company ? "OWNER" : null);
}

export function userBelongsToCompany(
  user: SessionUser | null,
  companyId: string,
): boolean {
  const company = getSessionCompany(user);
  return company?.id === companyId;
}

export function userCanManageInventory(user: SessionUser | null): boolean {
  const role = getSessionRole(user);
  return role ? canManageInventory(role) : false;
}

type BuyerResource = {
  userId: string | null;
  buyerEmail: string;
  accessToken: string;
  listing: { companyId: string };
};

export function canViewBuyerResource(
  user: SessionUser | null,
  resource: BuyerResource,
  token?: string | null,
): boolean {
  if (token && token === resource.accessToken) {
    return true;
  }

  if (!user) {
    return false;
  }

  if (resource.userId && resource.userId === user.id) {
    return true;
  }

  if (
    normalizeEmail(resource.buyerEmail) === normalizeEmail(user.email)
  ) {
    return true;
  }

  return userBelongsToCompany(user, resource.listing.companyId);
}
