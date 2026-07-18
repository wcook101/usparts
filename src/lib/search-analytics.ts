import type { SearchMode } from "@/generated/prisma/client";
import { startOfTodayEastern } from "@/lib/datetime";
import { db } from "@/lib/db";
import {
  classifyVisitor,
  getUserAgentFromHeaders,
  isBotVisitor,
  isHumanVisitor,
  type VisitorLabel,
} from "@/lib/visitor-classify";

const MAX_QUERY_TEXT_LENGTH = 2000;

export type LogSearchEventInput = {
  mode: SearchMode;
  queryText: string;
  resultCount: number;
  queriedCount?: number;
  manufacturer?: string | null;
  category?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId?: string | null;
};

function normalizeIpAddress(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "unknown") {
    return null;
  }

  return trimmed.slice(0, 100);
}

function normalizeUserAgent(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 500);
}

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
        ipAddress: normalizeIpAddress(input.ipAddress),
        userAgent: normalizeUserAgent(input.userAgent),
        userId: input.userId ?? null,
      },
    })
    .catch((error) => {
      console.error("Failed to log search event:", error);
    });
}

export { getUserAgentFromHeaders };

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
    visitorsToday: {
      human: number;
      bot: number;
      google: number;
      microsoft: number;
      meta: number;
      unknownScrapers: number;
      knownSuppliers: number;
      returning: number;
      unclassified: number;
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
    ipAddress: string | null;
    userEmail: string | null;
    visitorLabel: VisitorLabel;
    createdAt: string;
  }>;
};

type UserCompanyHint = {
  email: string;
  company: { id: string } | null;
  memberships: Array<{ id: string }>;
};

function isKnownSupplierUser(user: UserCompanyHint | null | undefined) {
  if (!user) return false;
  return Boolean(user.company || user.memberships.length > 0);
}

function emptyVisitorToday() {
  return {
    human: 0,
    bot: 0,
    google: 0,
    microsoft: 0,
    meta: 0,
    unknownScrapers: 0,
    knownSuppliers: 0,
    returning: 0,
    unclassified: 0,
  };
}

function bumpVisitorToday(
  stats: ReturnType<typeof emptyVisitorToday>,
  label: VisitorLabel,
) {
  if (isHumanVisitor(label)) stats.human += 1;
  if (isBotVisitor(label)) stats.bot += 1;
  if (label === "Google Search Bot") stats.google += 1;
  if (label === "Microsoft Search Bot") stats.microsoft += 1;
  if (label === "Meta AI") stats.meta += 1;
  if (label === "Unknown Scraper") stats.unknownScrapers += 1;
  if (label === "Known Supplier") stats.knownSuppliers += 1;
  if (label === "Returning Visitor") stats.returning += 1;
  if (label === "Unclassified") stats.unclassified += 1;
}

export async function getSearchAnalytics(): Promise<SearchAnalytics> {
  const now = new Date();
  const startOfToday = startOfTodayEastern(now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    today,
    last7Days,
    last30Days,
    modeGroups,
    topGroups,
    recentRows,
    todayRows,
  ] = await Promise.all([
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
        user: {
          select: {
            email: true,
            company: { select: { id: true } },
            memberships: { select: { id: true }, take: 1 },
          },
        },
      },
    }),
    db.searchEvent.findMany({
      where: { createdAt: { gte: startOfToday } },
      select: {
        id: true,
        createdAt: true,
        ipAddress: true,
        userAgent: true,
        user: {
          select: {
            email: true,
            company: { select: { id: true } },
            memberships: { select: { id: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const ipsForReturning = new Set<string>();
  for (const row of recentRows) {
    if (row.ipAddress) ipsForReturning.add(row.ipAddress);
  }
  for (const row of todayRows) {
    if (row.ipAddress) ipsForReturning.add(row.ipAddress);
  }

  const returningIpSet = new Set<string>();
  if (ipsForReturning.size > 0) {
    const priorByIp = await db.searchEvent.groupBy({
      by: ["ipAddress"],
      where: {
        ipAddress: { in: [...ipsForReturning] },
        createdAt: { lt: startOfToday },
      },
      _count: { _all: true },
    });
    for (const row of priorByIp) {
      if (row.ipAddress && row._count._all > 0) {
        returningIpSet.add(row.ipAddress);
      }
    }
  }

  // Same-day return: IP already searched earlier today.
  const seenIpToday = new Set<string>();
  const visitorsToday = emptyVisitorToday();
  for (const row of todayRows) {
    const ip = row.ipAddress;
    const returning =
      Boolean(ip && returningIpSet.has(ip)) ||
      Boolean(ip && seenIpToday.has(ip));
    if (ip) seenIpToday.add(ip);

    const label = classifyVisitor({
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      isKnownSupplier: isKnownSupplierUser(row.user),
      isReturningVisitor: returning,
    });
    bumpVisitorToday(visitorsToday, label);
  }

  const byMode = { single: 0, bulk: 0, smart: 0 };
  for (const row of modeGroups) {
    if (row.mode === "SINGLE") byMode.single = row._count._all;
    if (row.mode === "BULK") byMode.bulk = row._count._all;
    if (row.mode === "SMART") byMode.smart = row._count._all;
  }

  // For recent rows, also treat multiple appearances in the recent window as returning.
  const recentIpCounts = new Map<string, number>();
  for (const row of recentRows) {
    if (!row.ipAddress) continue;
    recentIpCounts.set(
      row.ipAddress,
      (recentIpCounts.get(row.ipAddress) ?? 0) + 1,
    );
  }

  return {
    stats: {
      today,
      last7Days,
      last30Days,
      byMode,
      visitorsToday,
    },
    topQueries: topGroups.map((row) => ({
      queryText: row.queryText,
      count: row._count._all,
    })),
    recent: recentRows.map((row) => {
      const ip = row.ipAddress;
      const returning =
        Boolean(ip && returningIpSet.has(ip)) ||
        Boolean(ip && (recentIpCounts.get(ip) ?? 0) > 1);

      return {
        id: row.id,
        mode: row.mode,
        queryText: row.queryText,
        resultCount: row.resultCount,
        queriedCount: row.queriedCount,
        manufacturer: row.manufacturer,
        category: row.category,
        ipAddress: row.ipAddress,
        userEmail: row.user?.email ?? null,
        visitorLabel: classifyVisitor({
          userAgent: row.userAgent,
          ipAddress: row.ipAddress,
          isKnownSupplier: isKnownSupplierUser(row.user),
          isReturningVisitor: returning,
        }),
        createdAt: row.createdAt.toISOString(),
      };
    }),
  };
}
