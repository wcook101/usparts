import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  consumeGuestSearch,
  getGuestSearchAccess,
  guestSearchLimitResponse,
} from "@/lib/guest-search-limit";
import { bulkSearchListings } from "@/lib/listings";
import { bulkSearchSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bulkSearchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid bulk search request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = await getSessionUser();
  const guestSearch = await getGuestSearchAccess(user);

  if (!guestSearch.allowed) {
    return NextResponse.json(
      { ...guestSearchLimitResponse(), guestSearch },
      { status: 403 },
    );
  }

  const updatedGuestSearch = await consumeGuestSearch(user);

  const results = await bulkSearchListings(parsed.data);
  return NextResponse.json({ ...results, guestSearch: updatedGuestSearch });
}
