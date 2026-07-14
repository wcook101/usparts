import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { AuthError } from "@/lib/auth/errors";
import {
  deleteCustomerLead,
  sendCustomerLeadEmail,
  updateCustomerLead,
} from "@/lib/customer-crm";
import {
  sendCustomerLeadEmailSchema,
  updateCustomerLeadSchema,
} from "@/lib/validations";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (body && typeof body === "object" && "sendEmail" in body) {
      const parsed = sendCustomerLeadEmailSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid email payload", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const record = await sendCustomerLeadEmail({
        id,
        subject: parsed.data.subject,
        message: parsed.data.message,
      });
      return NextResponse.json({ record });
    }

    const parsed = updateCustomerLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid customer lead update", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const record = await updateCustomerLead(id, {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name || null } : {}),
      ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
      ...(parsed.data.companyName !== undefined
        ? { companyName: parsed.data.companyName || null }
        : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone || null } : {}),
      ...(parsed.data.source !== undefined
        ? { source: parsed.data.source || null }
        : {}),
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
    });

    return NextResponse.json({ record });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Failed to update customer lead";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    await deleteCustomerLead(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Failed to delete customer lead";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
