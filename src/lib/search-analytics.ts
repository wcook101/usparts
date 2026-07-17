import type { SearchMode } from "@/generated/prisma/client";
import { startOfTodayEastern } from "@/lib/datetime";
import { db } from "@/lib/db";

const MAX_QUERY_TEXT_LENGTH = 2000;

export type LogSearchEventInput = {
  mode: SearchMode;
  queryText: string;
  resultCount: number;
  queriedCount?: number;
  manufacturer?: string | null;
  category?: string | null;
  userId?: string | null;
};

function truncateQueryText(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= MAX_QUERY_TEXT_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, MAX_QUERY_TEXT_LENGTH - 1)}…`;
}

/** Fire-and-forget search logging — never blocks or fails the search response. */
export function logSearchEvent(input: LogSearchEventInput) {
  const queryText = truncateQueryText(input.queryText);
  if (!queryText) {
    return;
  }

  void db.searchEvent
    .create({
      data: {
        mode: input.mode,
        queryText,
        resultCount: Math.max(0, input.resultCount),
        queriedCount:
          typeof input.queriedCount === "number" ? input.queriedCount : null,
        manufacturer: input.manufacturer?.trim() || null,
        category: input.category?.trim() || null,
        userId: input.userId ?? null,
      },
    })
    .catch((error) => {
      console.error("Failed to log search event:", error);
    });
}

export type SearchAnalytics = {
  stats: {
    today: number;
    last7Days: number;
    last30Days: number;
    byMode: {
      single: number;
      bulk: number;
      smart: number;
    };
  };
  topQueries: Array<{
    queryText: string;
    count: number;
  }>;
  recent: Array<{
    id: string;
    mode: SearchMode;
    queryText: string;
    resultCount: number;
    queriedCount: number | null;
    manufacturer: string | null;
    category: string | null;
    userEmail: string | null;
    createdAt: string;
  }>;
};

export async function getSearchAnalytics(): Promise<SearchAnalytics> {
  const now = new Date();
  const startOfToday = startOfTodayEastern(now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [today, last7Days, last30Days, modeGroups, topGroups, recentRows] =
    await Promise.all([
      db.searchEvent.count({ where: { createdAt: { gte: startOfToday } } }),
      db.searchEvent.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.searchEvent.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.searchEvent.groupBy({
        by: ["mode"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { _all: true },
      }),
      db.searchEvent.groupBy({
        by: ["queryText"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { _all: true },
        orderBy: { _count: { queryText: "desc" } },
        take: 20,
      }),
      db.searchEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 75,
        include: {
          user: { select: { email: true } },
        },
      }),
    ]);

  const byMode = { single: 0, bulk: 0, smart: 0 };
  for (const row of modeGroups) {
    if (row.mode === "SINGLE") byMode.single = row._count._all;
    if (row.mode === "BULK") byMode.bulk = row._count._all;
    if (row.mode === "SMART") byMode.smart = row._count._all;
  }

  return {
    stats: {
      today,
      last7Days,
      last30Days,
      byMode,
    },
    topQueries: topGroups.map((row) => ({
      queryText: row.queryText,
      count: row._count._all,
    })),
    recent: recentRows.map((row) => ({
      id: row.id,
      mode: row.mode,
      queryText: row.queryText,
      resultCount: row.resultCount,
      queriedCount: row.queriedCount,
      manufacturer: row.manufacturer,
      category: row.category,
      userEmail: row.user?.email ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
