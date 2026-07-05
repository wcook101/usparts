import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Company, User } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/admin";
import { AuthError } from "@/lib/auth/errors";
import {
  claimCompanyForUser,
  detachPlatformAdminSupplierIdentity,
  linkUnownedCompanyByEmail,
} from "@/lib/auth/ownership";
import {
  canInviteMembers,
  canManageInventory,
  resolveCompanyMembership,
  type CompanyMembership,
} from "@/lib/auth/membership";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/auth/constants";

export type SessionUser = User & {
  company: Company | null;
  membership: CompanyMembership | null;
};

function getSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = createSessionToken();
  const expiresAt = getSessionExpiry();

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: getSessionExpiry(),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } });
}

async function loadSessionUser(
  user: User & { company: Company | null },
): Promise<SessionUser> {
  if (isPlatformAdmin(user.email)) {
    await detachPlatformAdminSupplierIdentity(user.id, user.email);

    return {
      ...user,
      company: null,
      membership: null,
    };
  }

  let company = user.company;

  if (!company) {
    const linked = await linkUnownedCompanyByEmail(user.id, user.email);
    company = linked;
  }

  const membership = await resolveCompanyMembership(user.id, company);

  return {
    ...user,
    company,
    membership,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }

  return loadSessionUser(session.user);
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    throw new AuthError("You must be logged in to perform this action");
  }

  return user;
}

export async function requireCompanyOwner(companyId: string): Promise<{
  user: SessionUser;
  company: Company;
}> {
  const user = await requireAuth();

  if (user.company?.id === companyId) {
    return { user, company: user.company };
  }

  const claimed = await claimCompanyForUser(user.id, user.email, companyId);
  if (claimed) {
    const membership = await resolveCompanyMembership(user.id, claimed);
    return {
      user: { ...user, company: claimed, membership },
      company: claimed,
    };
  }

  const company = await db.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new AuthError("Company not found", 404);
  }

  if (!company.ownerId) {
    throw new AuthError(
      "This company is not linked to your account. Sign in with the company business email to claim it.",
      403,
    );
  }

  if (company.ownerId !== user.id) {
    throw new AuthError("You do not have access to this company", 403);
  }

  return { user: { ...user, company }, company };
}

export async function requireOwnedCompany(): Promise<{
  user: SessionUser;
  company: Company;
  role: "OWNER" | "ADMIN";
}> {
  const user = await requireAuth();

  if (user.membership && canManageInventory(user.membership.role)) {
    return {
      user,
      company: user.membership.company,
      role: user.membership.role === "OWNER" ? "OWNER" : "ADMIN",
    };
  }

  if (user.company) {
    return { user, company: user.company, role: "OWNER" };
  }

  const linked = await linkUnownedCompanyByEmail(user.id, user.email);
  if (linked) {
    const membership = await resolveCompanyMembership(user.id, linked);
    return {
      user: { ...user, company: linked, membership },
      company: linked,
      role: "OWNER",
    };
  }

  throw new AuthError("You do not have permission to manage this inventory", 403);
}

export async function requireCompanyTeamOwner(): Promise<{
  user: SessionUser;
  company: Company;
}> {
  const user = await requireAuth();

  if (user.membership && canInviteMembers(user.membership.role)) {
    return { user, company: user.membership.company };
  }

  if (user.company) {
    return { user, company: user.company };
  }

  throw new AuthError("Only the company owner can manage team invites", 403);
}

export function authErrorResponse(error: AuthError) {
  return Response.json({ error: error.message }, { status: error.status });
}

export function toAuthUserPayload(user: SessionUser) {
  const company = user.membership?.company ?? user.company;
  const role = user.membership?.role ?? (user.company ? "OWNER" : null);
  const buyerCompanyName = company?.name ?? null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    company: company
      ? {
          id: company.id,
          name: company.name,
        }
      : null,
    role,
    canManageInventory: role ? canManageInventory(role) : false,
    canInviteMembers: role ? canInviteMembers(role) : false,
    isPlatformAdmin: isPlatformAdmin(user.email),
    buyerProfile: company
      ? {
          name: user.name ?? "",
          email: user.email,
          companyName: buyerCompanyName ?? "",
        }
      : null,
  };
}

export function getBuyerDefaults(user: SessionUser | null) {
  if (!user) {
    return null;
  }

  const company = user.membership?.company ?? user.company;
  const buyerName =
    user.name?.trim() ||
    user.email.split("@")[0] ||
    user.email;

  if (company) {
    return {
      buyerName,
      buyerEmail: user.email,
      buyerCompany: company.name,
    };
  }

  return {
    buyerName,
    buyerEmail: user.email,
    buyerCompany: "",
  };
}
