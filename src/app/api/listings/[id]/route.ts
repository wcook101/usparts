import { NextResponse } from "next/server";
import { getListingById } from "@/lib/listings";
import {
  authErrorResponse,
  isAuthError,
  requireOwnedCompany,
} from "@/lib/auth";
import { updateListingForCompany } from "@/lib/listings";
import { updateListingSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const listing = await getListingById(id);

  if (!listing || !listing.isActive) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { company } = await requireOwnedCompany();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid listing data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const listing = await updateListingForCompany(company.id, id, {
      ...(data.mpn !== undefined ? { mpn: data.mpn } : {}),
      ...(data.manufacturer !== undefined
        ? { manufacturer: data.manufacturer }
        : {}),
      ...(data.description !== undefined
        ? { description: data.description || null }
        : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
      ...(data.price !== undefined ? { price: data.price ?? null } : {}),
      ...(data.currency !== undefined ? { currency: data.currency } : {}),
      ...(data.condition !== undefined ? { condition: data.condition } : {}),
      ...(data.dateCode !== undefined ? { dateCode: data.dateCode || null } : {}),
      ...(data.leadTimeDays !== undefined
        ? { leadTimeDays: data.leadTimeDays ?? null }
        : {}),
      ...(data.inventoryLocationId !== undefined
        ? { inventoryLocationId: data.inventoryLocationId }
        : {}),
      ...(data.datasheetUrl !== undefined
        ? { datasheetUrl: data.datasheetUrl || null }
        : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    });

    return NextResponse.json(listing);
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    const message =
      error instanceof Error ? error.message : "Failed to update listing";
    const status = message.includes("not found") ? 404 : 400;

    if (status !== 404) {
      console.error("Failed to update listing:", error);
    }

    return NextResponse.json({ error: message }, { status });
  }
}
