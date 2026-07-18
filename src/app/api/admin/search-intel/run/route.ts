import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth";
import { aggregateSearchIntelRange } from "@/lib/search-intel/aggregate";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !isPlatformAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    includeToday?: boolean;
  };

  const results = await aggregateSearchIntelRange({
    includeToday: body.includeToday !== false,
  });

  return NextResponse.json({
    ok: true,
    days: results.length,
    results,
  });
}
