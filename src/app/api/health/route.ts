import { NextResponse } from "next/server";
import { getProductionFingerprint } from "@/lib/production-fingerprint";
import { getSearchPipelineHealth } from "@/lib/search-analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const fingerprint = getProductionFingerprint();
  let search: Awaited<ReturnType<typeof getSearchPipelineHealth>> | null = null;
  try {
    search = await getSearchPipelineHealth();
  } catch {
    search = null;
  }

  return NextResponse.json({
    status: fingerprint.matchesExpected ? "ok" : "misconfigured",
    service: "usparts",
    production: {
      project: fingerprint.projectName,
      projectId: fingerprint.projectId,
      environment: fingerprint.environmentName,
      service: fingerprint.serviceName,
      expectedDomain: fingerprint.expectedDomain,
      database: fingerprint.database,
      gitCommit: fingerprint.gitCommit,
      gitBranch: fingerprint.gitBranch,
      deploymentId: fingerprint.deploymentId,
      deploymentTime: fingerprint.deploymentTime,
      checkedAt: fingerprint.checkedAt,
      matchesExpected: fingerprint.matchesExpected,
      mismatchReasons: fingerprint.mismatchReasons,
    },
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
