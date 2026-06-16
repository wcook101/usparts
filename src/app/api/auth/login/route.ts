import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  acceptCompanyInvite,
  authErrorResponse,
  createSession,
  isAuthError,
  linkUnownedCompanyByEmail,
  setSessionCookie,
  toAuthUserPayload,
  verifyPassword,
} from "@/lib/auth";
import { resolveCompanyMembership } from "@/lib/auth/membership";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid login data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const user = await db.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: { company: true },
    });

    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    let membership = await resolveCompanyMembership(user.id, user.company);

    if (data.inviteToken) {
      membership = await acceptCompanyInvite({
        token: data.inviteToken,
        userId: user.id,
        userEmail: user.email,
      });
    } else if (!membership) {
      const linkedCompany = await linkUnownedCompanyByEmail(user.id, user.email);
      membership = await resolveCompanyMembership(user.id, linkedCompany);
    }

    const sessionUser = {
      ...user,
      company: user.company ?? membership?.company ?? null,
      membership,
    };

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      user: toAuthUserPayload(sessionUser),
    });
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Login failed:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
