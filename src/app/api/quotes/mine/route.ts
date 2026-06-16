import { NextResponse } from "next/server";
import { authErrorResponse, isAuthError, requireAuth } from "@/lib/auth";
import { getQuotesForUser } from "@/lib/quotes";

export async function GET() {
  try {
    const user = await requireAuth();
    const quotes = await getQuotesForUser(user.id, user.email);

    return NextResponse.json({
      quotes: quotes.map((quote) => ({
        id: quote.id,
        status: quote.status,
        quantity: quote.quantity,
        createdAt: quote.createdAt,
        listing: {
          id: quote.listing.id,
          mpn: quote.listing.mpn,
          manufacturer: quote.listing.manufacturer,
          company: {
            id: quote.listing.company.id,
            name: quote.listing.company.name,
          },
        },
      })),
    });
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to load quotes:", error);
    return NextResponse.json({ error: "Failed to load quotes" }, { status: 500 });
  }
}
