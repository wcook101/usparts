import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { bulkSearchListings } from "@/lib/listings";
import { getClientIp } from "@/lib/rate-limit";
import {
  getUserAgentFromHeaders,
  logSearchEvent,
} from "@/lib/search-analytics";
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

  const results = await bulkSearchListings(parsed.data);
  const user = await getSessionUser();

  await logSearchEvent({
    mode: "BULK",
    queryText: parsed.data.mpns,
    resultCount: results.totalListingCount,
    queriedCount: results.queriedCount,
    manufacturer: parsed.data.manufacturer,
    category: parsed.data.category,
    ipAddress: getClientIp(request.headers),
    userAgent: getUserAgentFromHeaders(request.headers),
    userId: user?.id,
  });

  return NextResponse.json(results);
}
