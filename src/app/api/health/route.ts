import { NextResponse } from "next/server";
import { getSearchPipelineHealth } from "@/lib/search-analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  let search: Awaited<ReturnType<typeof getSearchPipelineHealth>> | null = null;
  try {
    search = await getSearchPipelineHealth();
  } catch {
    search = null;
  }

  return NextResponse.json({
    status: "ok",
    service: "usparts",
    searchPipeline: search
      ? {
          lastEventAt: search.lastEventAt,
          eventsToday: search.eventsToday,
          eventsLastHour: search.eventsLastHour,
          warehouseLastBuiltAt: search.warehouseLastBuiltAt,
          warehouseLastDay: search.warehouseLastDay,
          unprocessedHint: search.unprocessedHint,
          stale: search.stale,
          lastLogFailureAt: search.lastLogFailure?.at ?? null,
        }
      : { error: "unavailable" },
  });
}
