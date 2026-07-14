import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  authErrorResponse,
  createSession,
  hashPassword,
  isAuthError,
  linkUnownedCompanyByEmail,
  setSessionCookie,
  toAuthUserPayload,
  acceptCompanyInvite,
  getInviteByToken,
} from "@/lib/auth";
import { resolveCompanyMembership } from "@/lib/auth/membership";
import { normalizeEmail } from "@/lib/auth/ownership";
import { linkCustomerLeadOnSignup } from "@/lib/customer-crm";
import { signupSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const acceptedTermsIssue = parsed.error.issues.find(
        (issue) => issue.path[0] === "acceptedTerms",
      );
      const message =
        acceptedTermsIssue?.message ??
        (parsed.error.issues[0]?.message || "Invalid signup data");

      return NextResponse.json(
        { error: message, details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const email = data.email.toLowerCase();

    if (data.inviteToken) {
      const invite = await getInviteByToken(data.inviteToken);
      if (!invite || invite.status !== "PENDING") {
        return NextResponse.json({ error: "Invite is not valid" }, { status: 400 });
      }

      if (normalizeEmail(invite.email) !== email) {
        return NextResponse.json(
          { error: "Use the email address that received the invite" },
          { status: 400 },
        );
      }
    }

    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(data.password);
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name: data.name || null,
      },
      include: { company: true },
    });

    let company = user.company;
    let membership = null;

    if (data.inviteToken) {
      membership = await acceptCompanyInvite({
        token: data.inviteToken,
        userId: user.id,
        userEmail: user.email,
      });
    } else {
      const linkedCompany = await linkUnownedCompanyByEmail(user.id, user.email);
      company = linkedCompany;
      membership = await resolveCompanyMembership(user.id, company);
    }

    const sessionUser = {
      ...user,
      company,
      membership,
    };

    try {
      await linkCustomerLeadOnSignup({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
    } catch (crmError) {
      console.error("Customer CRM signup link failed:", crmError);
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json(
      { user: toAuthUserPayload(sessionUser) },
      { status: 201 },
    );
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Signup failed:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
