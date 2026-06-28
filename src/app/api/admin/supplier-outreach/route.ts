import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { AuthError } from "@/lib/auth/errors";
import {
  createSupplierOutreach,
  listSupplierOutreach,
} from "@/lib/supplier-outreach";
import { createSupplierOutreachSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const result = await listSupplierOutreach();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePlatformAdmin();
    const body = await request.json().catch(() => null);
    const parsed = createSupplierOutreachSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid outreach record", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const record = await createSupplierOutreach({
      companyName: parsed.data.companyName,
      contactName: parsed.data.contactName || null,
      contactEmail: parsed.data.contactEmail || null,
      website: parsed.data.website || null,
      status: parsed.data.status,
      contactedAt: parsed.data.contactedAt
        ? new Date(parsed.data.contactedAt)
        : undefined,
      notes: parsed.data.notes || null,
      addedById: user.id,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Failed to create outreach record";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
