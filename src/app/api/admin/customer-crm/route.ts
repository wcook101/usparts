import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { AuthError } from "@/lib/auth/errors";
import {
  createCustomerLead,
  listCustomerLeads,
} from "@/lib/customer-crm";
import { createCustomerLeadSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const result = await listCustomerLeads();
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
    const parsed = createCustomerLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid customer lead", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const record = await createCustomerLead({
      name: parsed.data.name || null,
      email: parsed.data.email,
      companyName: parsed.data.companyName || null,
      phone: parsed.data.phone || null,
      source: parsed.data.source || null,
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
      error instanceof Error ? error.message : "Failed to create customer lead";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
