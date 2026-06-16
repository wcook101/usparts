import { NextResponse } from "next/server";
import {
  authErrorResponse,
  isAuthError,
  requireAuth,
  toAuthUserPayload,
} from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    return NextResponse.json({
      user: toAuthUserPayload(user),
    });
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Session lookup failed:", error);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}
