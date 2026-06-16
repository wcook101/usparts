import { NextResponse } from "next/server";
import {
  acceptCompanyInvite,
  authErrorResponse,
  isAuthError,
  requireAuth,
  toAuthUserPayload,
} from "@/lib/auth";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { token } = await context.params;

    const membership = await acceptCompanyInvite({
      token,
      userId: user.id,
      userEmail: user.email,
    });

    const sessionUser = {
      ...user,
      company: user.company,
      membership,
    };

    return NextResponse.json({
      user: toAuthUserPayload(sessionUser),
      membership: {
        companyId: membership.companyId,
        role: membership.role,
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to accept invite:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 },
    );
  }
}
