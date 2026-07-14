import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { AuthError } from "@/lib/auth/errors";
import { updatePriorityAccount } from "@/lib/priority-accounts";
import { updatePriorityAccountSchema } from "@/lib/validations";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requirePlatformAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updatePriorityAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid priority account update", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const record = await updatePriorityAccount(id, {
      ...(parsed.data.website !== undefined
        ? { website: parsed.data.website || null }
        : {}),
      ...(parsed.data.decisionMakerName !== undefined
        ? { decisionMakerName: parsed.data.decisionMakerName || null }
        : {}),
      ...(parsed.data.decisionMakerTitle !== undefined
        ? { decisionMakerTitle: parsed.data.decisionMakerTitle || null }
        : {}),
      ...(parsed.data.decisionMakerEmail !== undefined
        ? { decisionMakerEmail: parsed.data.decisionMakerEmail || null }
        : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone || null } : {}),
      ...(parsed.data.linkedInUrl !== undefined
        ? { linkedInUrl: parsed.data.linkedInUrl || null }
        : {}),
      ...(parsed.data.researchNotes !== undefined
        ? { researchNotes: parsed.data.researchNotes || null }
        : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      updatedById: user.id,
    });

    return NextResponse.json({ record });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Failed to update priority account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
