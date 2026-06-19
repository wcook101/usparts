import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { AuthError } from "@/lib/auth/errors";
import { createPartAlias, listPartAliases } from "@/lib/part-aliases";
import { createPartAliasSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const aliases = await listPartAliases();
    return NextResponse.json({ aliases });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    await requirePlatformAdmin();
    const body = await request.json().catch(() => null);
    const parsed = createPartAliasSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid alias", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const alias = await createPartAlias({
      fromMpn: parsed.data.fromMpn,
      toMpn: parsed.data.toMpn,
      manufacturer: parsed.data.manufacturer || null,
      confidence: parsed.data.confidence,
      source: "manual_admin",
    });

    return NextResponse.json({ alias }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Failed to create alias";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
