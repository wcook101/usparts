import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  authErrorResponse,
  isAuthError,
  requireOwnedCompany,
} from "@/lib/auth";
import { createListingSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid listing data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const { company } = await requireOwnedCompany();

    if (data.companyId && data.companyId !== company.id) {
      return NextResponse.json(
        { error: "You can only create listings for your own company" },
        { status: 403 },
      );
    }

    const companyWithLocations = await db.company.findUnique({
      where: { id: company.id },
      include: { inventoryLocations: true },
    });

    if (!companyWithLocations) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const location = companyWithLocations.inventoryLocations.find(
      (item) => item.id === data.inventoryLocationId,
    );

    if (!location) {
      return NextResponse.json(
        { error: "Select a valid inventory location for this company" },
        { status: 400 },
      );
    }

    const listing = await db.partListing.create({
      data: {
        companyId: company.id,
        inventoryLocationId: location.id,
        mpn: data.mpn,
        manufacturer: data.manufacturer,
        description: data.description || null,
        category: data.category,
        quantity: data.quantity,
        price: data.price ?? null,
        currency: data.currency,
        condition: data.condition,
        dateCode: data.dateCode || null,
        leadTimeDays: data.leadTimeDays,
        datasheetUrl: data.datasheetUrl || null,
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to create listing:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 },
    );
  }
}
