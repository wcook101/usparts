import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authErrorResponse,
  isAuthError,
  requireCompanyTeamOwner,
} from "@/lib/auth";
import { db } from "@/lib/db";

const revokeInviteSchema = z.object({
  inviteId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const { company } = await requireCompanyTeamOwner();
    const body = await request.json();
    const parsed = revokeInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const invite = await db.companyInvite.findFirst({
      where: {
        id: parsed.data.inviteId,
        companyId: company.id,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending invites can be revoked" },
        { status: 400 },
      );
    }

    await db.companyInvite.update({
      where: { id: invite.id },
      data: { status: "REVOKED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to revoke invite:", error);
    return NextResponse.json({ error: "Failed to revoke invite" }, { status: 500 });
  }
}
