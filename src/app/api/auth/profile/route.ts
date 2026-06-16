import { NextResponse } from "next/server";
import { authErrorResponse, isAuthError, requireAuth, toAuthUserPayload } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations";
import { db } from "@/lib/db";

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid profile data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name },
      include: { company: true },
    });

    const sessionUser = {
      ...updated,
      company: user.company,
      membership: user.membership,
    };

    return NextResponse.json({
      user: toAuthUserPayload(sessionUser),
    });
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
