import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  consumeGuestSearch,
  getGuestSearchAccess,
} from "@/lib/guest-search-access";
import { guestSearchLimitResponse } from "@/lib/guest-search-limit";
import { hasSearchCriteria, searchListings } from "@/lib/listings";
import { searchQuerySchema } from "@/lib/validations";

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

  const user = await getSessionUser();
  const isNewSearch = hasSearchCriteria(parsed.data) && parsed.data.page === 1;

  if (isNewSearch) {
    const guestSearch = await getGuestSearchAccess(user);
    if (!guestSearch.allowed) {
      return NextResponse.json(
        { ...guestSearchLimitResponse(), guestSearch },
        { status: 403 },
      );
    }
    const updatedGuestSearch = await consumeGuestSearch(user);
    const results = await searchListings(parsed.data);
    return NextResponse.json({ ...results, guestSearch: updatedGuestSearch });
  }

  const results = await searchListings(parsed.data);
  return NextResponse.json(results);
}
