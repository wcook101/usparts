import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await requestPasswordReset(parsed.data.email);

    return NextResponse.json({
      message:
        "If an account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Password reset request failed:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 },
    );
  }
}
