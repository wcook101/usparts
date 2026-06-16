import { NextResponse } from "next/server";
import {
  authErrorResponse,
  isAuthError,
  requireCompanyTeamOwner,
} from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ memberId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { user, company } = await requireCompanyTeamOwner();
    const { memberId } = await context.params;

    const member = await db.companyMember.findFirst({
      where: {
        id: memberId,
        companyId: company.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.role === "OWNER") {
      return NextResponse.json(
        { error: "The company owner cannot be removed" },
        { status: 400 },
      );
    }

    if (member.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the team" },
        { status: 400 },
      );
    }

    await db.companyMember.delete({
      where: { id: member.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to remove member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
