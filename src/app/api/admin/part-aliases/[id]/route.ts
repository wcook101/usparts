import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { AuthError } from "@/lib/auth/errors";
import { deletePartAlias } from "@/lib/part-aliases";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    await deletePartAlias(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Failed to delete alias";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
