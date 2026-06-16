import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid reset data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await resetPasswordWithToken(parsed.data.token, parsed.data.password);

    return NextResponse.json({
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reset password";

    console.error("Password reset failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
