import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { AuthError } from "@/lib/auth/errors";
import {
  deleteSupplierOutreach,
  updateSupplierOutreach,
} from "@/lib/supplier-outreach";
import { updateSupplierOutreachSchema } from "@/lib/validations";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateSupplierOutreachSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid outreach update", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const record = await updateSupplierOutreach(id, {
      ...(parsed.data.companyName !== undefined
        ? { companyName: parsed.data.companyName }
        : {}),
      ...(parsed.data.contactName !== undefined
        ? { contactName: parsed.data.contactName || null }
        : {}),
      ...(parsed.data.contactEmail !== undefined
        ? { contactEmail: parsed.data.contactEmail || null }
        : {}),
      ...(parsed.data.website !== undefined ? { website: parsed.data.website || null } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.contactedAt !== undefined
        ? { contactedAt: new Date(parsed.data.contactedAt) }
        : {}),
      ...(parsed.data.lastFollowUpAt !== undefined
        ? {
            lastFollowUpAt: parsed.data.lastFollowUpAt
              ? new Date(parsed.data.lastFollowUpAt)
              : null,
          }
        : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes || null } : {}),
      ...(parsed.data.companyId !== undefined ? { companyId: parsed.data.companyId } : {}),
    });

    return NextResponse.json({ record });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Failed to update outreach record";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    await deleteSupplierOutreach(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Failed to delete outreach record";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
