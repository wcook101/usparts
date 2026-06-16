import { randomBytes } from "node:crypto";
import type { CompanyMemberRole } from "@/generated/prisma/client";
import { AuthError } from "@/lib/auth/errors";
import { ensureOwnerMembership } from "@/lib/auth/membership";
import { normalizeEmail } from "@/lib/auth/ownership";
import { db } from "@/lib/db";
import { emailMatchesDomain } from "@/lib/email-domain";

const INVITE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function createInviteToken(): string {
  return randomBytes(24).toString("hex");
}

export async function createCompanyInvite(input: {
  companyId: string;
  email: string;
  role: CompanyMemberRole;
  invitedById: string;
}) {
  const email = normalizeEmail(input.email);
  const company = await db.company.findUnique({
    where: { id: input.companyId },
  });

  if (!company) {
    throw new AuthError("Company not found", 404);
  }

  if (!emailMatchesDomain(email, company.emailDomain)) {
    throw new AuthError(
      `Invite email must use @${company.emailDomain}`,
      400,
    );
  }

  if (input.role === "OWNER") {
    throw new AuthError("Cannot invite another owner", 400);
  }

  const existingUser = await db.user.findUnique({
    where: { email },
    include: {
      memberships: { where: { companyId: company.id } },
      company: true,
    },
  });

  if (existingUser?.company) {
    throw new AuthError("This user already owns a supplier company", 409);
  }

  if (existingUser?.memberships.some((item) => item.companyId === company.id)) {
    throw new AuthError("This user is already on your team", 409);
  }

  const token = createInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_DURATION_MS);

  const invite = await db.companyInvite.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email,
      },
    },
    create: {
      companyId: company.id,
      email,
      role: input.role,
      token,
      invitedById: input.invitedById,
      status: "PENDING",
      expiresAt,
    },
    update: {
      role: input.role,
      token,
      invitedById: input.invitedById,
      status: "PENDING",
      expiresAt,
    },
    include: {
      company: true,
      invitedBy: { select: { email: true, name: true } },
    },
  });

  return invite;
}

export async function getInviteByToken(token: string) {
  const invite = await db.companyInvite.findUnique({
    where: { token },
    include: {
      company: true,
      invitedBy: { select: { email: true, name: true } },
    },
  });

  if (!invite) {
    return null;
  }

  if (invite.status !== "PENDING") {
    return invite;
  }

  if (invite.expiresAt < new Date()) {
    await db.companyInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });

    return {
      ...invite,
      status: "EXPIRED" as const,
    };
  }

  return invite;
}

export async function acceptCompanyInvite(input: {
  token: string;
  userId: string;
  userEmail: string;
}) {
  const invite = await getInviteByToken(input.token);

  if (!invite) {
    throw new AuthError("Invite not found", 404);
  }

  if (invite.status !== "PENDING") {
    throw new AuthError(`This invite is ${invite.status.toLowerCase()}`, 400);
  }

  const userEmail = normalizeEmail(input.userEmail);
  const inviteEmail = normalizeEmail(invite.email);

  if (userEmail !== inviteEmail) {
    throw new AuthError("Sign in with the invited email address to accept", 403);
  }

  if (!emailMatchesDomain(userEmail, invite.company.emailDomain)) {
    throw new AuthError(
      `Your email must use @${invite.company.emailDomain}`,
      400,
    );
  }

  const existingOwner = await db.company.findUnique({
    where: { ownerId: input.userId },
  });

  if (existingOwner && existingOwner.id !== invite.companyId) {
    throw new AuthError(
      "You already own a different supplier company",
      409,
    );
  }

  const otherMembership = await db.companyMember.findFirst({
    where: {
      userId: input.userId,
      companyId: { not: invite.companyId },
    },
  });

  if (otherMembership) {
    throw new AuthError("You are already on another company team", 409);
  }

  const membership = await db.$transaction(async (tx) => {
    await tx.companyInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });

    return tx.companyMember.upsert({
      where: {
        userId_companyId: {
          userId: input.userId,
          companyId: invite.companyId,
        },
      },
      create: {
        userId: input.userId,
        companyId: invite.companyId,
        role: invite.role,
      },
      update: {
        role: invite.role,
      },
      include: { company: true },
    });
  });

  if (invite.role === "OWNER") {
    await ensureOwnerMembership(input.userId, membership.company);
  }

  return membership;
}
