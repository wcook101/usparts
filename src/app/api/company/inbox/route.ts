import { NextResponse } from "next/server";
import {
  authErrorResponse,
  isAuthError,
  requireOwnedCompany,
} from "@/lib/auth";
import {
  getOrdersForCompany,
  getQuotesForCompany,
} from "@/lib/company-inbox";

export async function GET() {
  try {
    const { company } = await requireOwnedCompany();

    const [orders, quotes] = await Promise.all([
      getOrdersForCompany(company.id),
      getQuotesForCompany(company.id),
    ]);

    return NextResponse.json({ orders, quotes });
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to load company inbox:", error);
    return NextResponse.json(
      { error: "Failed to load inbox" },
      { status: 500 },
    );
  }
}
