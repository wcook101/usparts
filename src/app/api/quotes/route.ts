import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { notifyQuoteRequested } from "@/lib/notifications";
import { placeQuoteRequest } from "@/lib/quotes";
import { createQuoteSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createQuoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid quote request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await getSessionUser();
    const quote = await placeQuoteRequest(parsed.data, {
      userId: user?.id,
    });

    try {
      await notifyQuoteRequested({
        id: quote.id,
        accessToken: quote.accessToken,
        buyerName: quote.buyerName,
        buyerEmail: quote.buyerEmail,
        buyerCompany: quote.buyerCompany,
        quantity: quote.quantity,
        notes: quote.notes,
        listing: {
          mpn: quote.listing.mpn,
          manufacturer: quote.listing.manufacturer,
          company: {
            name: quote.listing.company.name,
            email: quote.listing.company.email,
          },
        },
      });
    } catch (error) {
      console.error("Quote notification failed:", error);
    }

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit quote request";
    const status = message.includes("not found") ? 404 : 400;

    console.error("Failed to submit quote request:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
