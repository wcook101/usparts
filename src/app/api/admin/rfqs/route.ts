import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { listAdminRfqActivity } from "@/lib/admin-rfqs";
import { AuthError } from "@/lib/auth/errors";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const result = await listAdminRfqActivity();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
