import { NextResponse } from "next/server";
import { getInviteByToken } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const invite = await getInviteByToken(token);

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  return NextResponse.json({
    invite: {
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      company: {
        id: invite.company.id,
        name: invite.company.name,
        emailDomain: invite.company.emailDomain,
      },
      invitedBy: invite.invitedBy,
    },
  });
}
