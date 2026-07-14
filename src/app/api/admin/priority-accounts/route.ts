import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { AuthError } from "@/lib/auth/errors";
import { listPriorityAccounts } from "@/lib/priority-accounts";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const result = await listPriorityAccounts();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
