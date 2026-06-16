import { NextResponse } from "next/server";
import {
  authErrorResponse,
  canViewBuyerResource,
  getSessionUser,
  isAuthError,
  requireOwnedCompany,
} from "@/lib/auth";
import { updateQuoteStatusForCompany } from "@/lib/company-inbox";
import { getQuoteById } from "@/lib/quotes";
import { updateQuoteStatusSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const quote = await getQuoteById(id);

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const user = await getSessionUser();

    if (
      !canViewBuyerResource(
        user,
        {
          userId: quote.userId,
          buyerEmail: quote.buyerEmail,
          accessToken: quote.accessToken,
          listing: { companyId: quote.listing.companyId },
        },
        token,
      )
    ) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to load quote:", error);
    return NextResponse.json({ error: "Failed to load quote" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { company } = await requireOwnedCompany();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateQuoteStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const quote = await updateQuoteStatusForCompany(
      id,
      company.id,
      parsed.data.status,
    );

    return NextResponse.json(quote);
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    const message =
      error instanceof Error ? error.message : "Failed to update quote";
    const status = message.includes("not found")
      ? 404
      : message.includes("Cannot change")
        ? 400
        : 500;

    if (status === 500) {
      console.error("Failed to update quote:", error);
    }

    return NextResponse.json({ error: message }, { status });
  }
}
