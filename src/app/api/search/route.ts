import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { hasSearchCriteria, searchListings } from "@/lib/listings";
import { logSearchEvent } from "@/lib/search-analytics";
import { searchQuerySchema } from "@/lib/validations";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = searchQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    manufacturer: searchParams.get("manufacturer") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const results = await searchListings(parsed.data);

  if (
    hasSearchCriteria(parsed.data) &&
    !results.recentOnly &&
    parsed.data.page === 1
  ) {
    const user = await getSessionUser();
    const queryParts = [
      parsed.data.q?.trim(),
      parsed.data.manufacturer ? `mfr:${parsed.data.manufacturer.trim()}` : null,
      parsed.data.category ? `cat:${parsed.data.category.trim()}` : null,
    ].filter(Boolean);

    logSearchEvent({
      mode: "SINGLE",
      queryText: queryParts.join(" · ") || "filter",
      resultCount: results.totalCount,
      manufacturer: parsed.data.manufacturer,
      category: parsed.data.category,
      userId: user?.id,
    });
  }

  return NextResponse.json(results, { headers: corsHeaders });
}
