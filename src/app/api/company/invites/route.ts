import { NextResponse } from "next/server";
import {
  authErrorResponse,
  createCompanyInvite,
  isAuthError,
  requireCompanyTeamOwner,
} from "@/lib/auth";
import { createCompanyInviteSchema } from "@/lib/validations";
import { db } from "@/lib/db";
import { notifyCompanyInvite } from "@/lib/notifications";

export async function GET() {
  try {
    const { user, company } = await requireCompanyTeamOwner();

    const [members, invites] = await Promise.all([
      db.companyMember.findMany({
        where: { companyId: company.id },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      }),
      db.companyInvite.findMany({
        where: {
          companyId: company.id,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      currentUserId: user.id,
      company: {
        id: company.id,
        name: company.name,
        emailDomain: company.emailDomain,
      },
      members: members.map((member) => ({
        id: member.id,
        role: member.role,
        user: member.user,
        createdAt: member.createdAt,
      })),
      invites: invites.map((invite) => ({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      })),
    });
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to load team:", error);
    return NextResponse.json({ error: "Failed to load team" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, company } = await requireCompanyTeamOwner();
    const body = await request.json();
    const parsed = createCompanyInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid invite data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const invite = await createCompanyInvite({
      companyId: company.id,
      email: parsed.data.email,
      role: parsed.data.role,
      invitedById: user.id,
    });

    await notifyCompanyInvite({
      email: invite.email,
      companyName: invite.company.name,
      role: invite.role,
      invitedByName: invite.invitedBy.name,
      invitedByEmail: invite.invitedBy.email,
      token: invite.token,
    });

    return NextResponse.json(
      {
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          token: invite.token,
          expiresAt: invite.expiresAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to create invite:", error);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
