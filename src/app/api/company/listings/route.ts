import { NextResponse } from "next/server";
import {
  authErrorResponse,
  isAuthError,
  requireOwnedCompany,
} from "@/lib/auth";
import { getListingsForCompany } from "@/lib/listings";

export async function GET(request: Request) {
  try {
    const { company } = await requireOwnedCompany();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "1";

    const listings = await getListingsForCompany(company.id, {
      includeInactive,
    });

    return NextResponse.json(listings);
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to load company listings:", error);
    return NextResponse.json(
      { error: "Failed to load listings" },
      { status: 500 },
    );
  }
}
