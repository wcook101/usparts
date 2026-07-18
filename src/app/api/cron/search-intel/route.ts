import { NextResponse } from "next/server";
import {
  aggregateSearchIntelDay,
  aggregateSearchIntelRange,
  easternDayDate,
} from "@/lib/search-intel/aggregate";
import { startOfTodayEastern } from "@/lib/datetime";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const header = request.headers.get("authorization")?.trim();
  if (header === `Bearer ${secret}`) {
    return true;
  }

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

/**
 * Nightly (or on-demand) search intelligence warehouse rollup.
 * Auth: Authorization: Bearer $CRON_SECRET
 * Query: ?backfill=1 to rebuild all days with SearchEvent data
 *        ?includeToday=1 to include the current Eastern day
 */
export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const backfill = url.searchParams.get("backfill") === "1";
  const includeToday = url.searchParams.get("includeToday") === "1";

  if (backfill) {
    const results = await aggregateSearchIntelRange({ includeToday: true });
    return NextResponse.json({
      ok: true,
      mode: "backfill",
      days: results.length,
      results,
    });
  }

  const todayStart = startOfTodayEastern();
  const target = includeToday
    ? todayStart
    : new Date(todayStart.getTime() - 12 * 60 * 60 * 1000);
  const result = await aggregateSearchIntelDay(easternDayDate(target));

  return NextResponse.json({ ok: true, mode: "nightly", result });
}

export async function GET(request: Request) {
  return POST(request);
}
