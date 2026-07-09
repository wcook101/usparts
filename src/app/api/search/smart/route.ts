import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { logSearchEvent } from "@/lib/search-analytics";
import { isSmartSearchEnabled, smartSearchListings } from "@/lib/smart-search";
import { SmartSearchBudgetExceededError } from "@/lib/smart-search-budget";
import { smartSearchSchema } from "@/lib/validations";

export async function GET() {
  return NextResponse.json({ enabled: isSmartSearchEnabled() });
}

export async function POST(request: Request) {
  if (!isSmartSearchEnabled()) {
    return NextResponse.json(
      {
        error:
          "Describe-a-part search is not available yet. Try part number search instead.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = smartSearchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid smart search request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const results = await smartSearchListings(parsed.data);
    const user = await getSessionUser();

    logSearchEvent({
      mode: "SMART",
      queryText: parsed.data.query,
      resultCount: results.search.totalListingCount,
      queriedCount: results.suggestedMpns.length,
      manufacturer: parsed.data.manufacturer,
      category: parsed.data.category,
      userId: user?.id,
    });

    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof SmartSearchBudgetExceededError) {
      console.warn(
        `Smart search budget exceeded for ${error.monthKey}: $${error.spentUsd.toFixed(2)} / $${error.budgetUsd.toFixed(2)}`,
      );
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    const message =
      error instanceof Error ? error.message : "Smart search failed";

    console.error("Smart search failed:", error);

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
