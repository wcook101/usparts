import type { SearchMode } from "@/generated/prisma/client";
import { startOfTodayEastern } from "@/lib/datetime";
import { db } from "@/lib/db";
import {
  classifyVisitor,
  getUserAgentFromHeaders,
  isBotVisitor,
  isClaimedSearchEngineCrawler,
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
  business: {
    humanSearchesToday: number;
    humanSearchesLast7Days: number;
    knownSuppliersToday: number;
    returningToday: number;
    rfqsToday: number;
    /** Submitted RFQs ÷ human searches today; null when no human searches. */
    humanSearchConversion: number | null;
    byModeHuman30d: {
      single: number;
      bulk: number;
      smart: number;
    };
    topHumanQueries: Array<{
      queryText: string;
      count: number;
    }>;
  };
  crawl: {
    botSearchesToday: number;
    googleToday: number;
    microsoftToday: number;
    metaToday: number;
    unknownScrapersToday: number;
    /**
     * UA-claimed Google + Microsoft crawlers today.
     * DNS reverse+forward verification is not applied yet.
     */
    claimedSearchEngineToday: number;
    /** Claimed search-engine crawlers ÷ total bot searches; null when no bots. */
    crawlerDiscovery: number | null;
    unclassifiedToday: number;
    topUnknownScraperIps: Array<{
      ipAddress: string;
      count: number;
    }>;
  };
  /** Total search events (bots + humans) — not a commercial KPI. */
  totals: {
    today: number;
    last7Days: number;
    last30Days: number;
  };
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

type ClassifiableRow = {
  ipAddress: string | null;
  userAgent: string | null;
  user: UserCompanyHint | null;
  queryText?: string;
  mode?: SearchMode;
  createdAt: Date;
};

function isKnownSupplierUser(user: UserCompanyHint | null | undefined) {
  if (!user) return false;
  return Boolean(user.company || user.memberships.length > 0);
}

function labelForRow(
  row: ClassifiableRow,
  returningIpSet: Set<string>,
  seenIpInWindow: Set<string>,
) {
  const ip = row.ipAddress;
  const returning =
    Boolean(ip && returningIpSet.has(ip)) ||
    Boolean(ip && seenIpInWindow.has(ip));
  if (ip) seenIpInWindow.add(ip);

  return classifyVisitor({
    userAgent: row.userAgent,
    ipAddress: row.ipAddress,
    isKnownSupplier: isKnownSupplierUser(row.user),
    isReturningVisitor: returning,
  });
}

function ratio(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return numerator / denominator;
}

export async function getSearchAnalytics(): Promise<SearchAnalytics> {
  const now = new Date();
  const startOfToday = startOfTodayEastern(now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const userInclude = {
    select: {
      email: true,
      company: { select: { id: true } },
      memberships: { select: { id: true }, take: 1 },
    },
  } as const;

  const [
    today,
    last7Days,
    last30Days,
    rfqsToday,
    recentRows,
    last30dRows,
  ] = await Promise.all([
    db.searchEvent.count({ where: { createdAt: { gte: startOfToday } } }),
    db.searchEvent.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.searchEvent.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.quoteRequest.count({ where: { createdAt: { gte: startOfToday } } }),
    db.searchEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 75,
      include: { user: userInclude },
    }),
    db.searchEvent.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        createdAt: true,
        ipAddress: true,
        userAgent: true,
        queryText: true,
        mode: true,
        user: userInclude,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const ipsForReturning = new Set<string>();
  for (const row of recentRows) {
    if (row.ipAddress) ipsForReturning.add(row.ipAddress);
  }
  for (const row of last30dRows) {
    if (row.ipAddress) ipsForReturning.add(row.ipAddress);
  }

  const returningIpSet = new Set<string>();
  if (ipsForReturning.size > 0) {
    const priorByIp = await db.searchEvent.groupBy({
      by: ["ipAddress"],
      where: {
        ipAddress: { in: [...ipsForReturning] },
        createdAt: { lt: thirtyDaysAgo },
      },
      _count: { _all: true },
    });
    for (const row of priorByIp) {
      if (row.ipAddress && row._count._all > 0) {
        returningIpSet.add(row.ipAddress);
      }
    }
  }

  let humanSearchesToday = 0;
  let humanSearchesLast7Days = 0;
  let knownSuppliersToday = 0;
  let returningToday = 0;
  let botSearchesToday = 0;
  let googleToday = 0;
  let microsoftToday = 0;
  let metaToday = 0;
  let unknownScrapersToday = 0;
  let claimedSearchEngineToday = 0;
  let unclassifiedToday = 0;
  const byModeHuman30d = { single: 0, bulk: 0, smart: 0 };
  const humanQueryCounts = new Map<string, number>();
  const unknownScraperIpCounts = new Map<string, number>();
  const seenIpIn30d = new Set<string>();

  for (const row of last30dRows) {
    const label = labelForRow(row, returningIpSet, seenIpIn30d);
    const isToday = row.createdAt >= startOfToday;
    const isLast7 = row.createdAt >= sevenDaysAgo;

    if (isHumanVisitor(label)) {
      if (isToday) humanSearchesToday += 1;
      if (isLast7) humanSearchesLast7Days += 1;
      if (row.mode === "SINGLE") byModeHuman30d.single += 1;
      if (row.mode === "BULK") byModeHuman30d.bulk += 1;
      if (row.mode === "SMART") byModeHuman30d.smart += 1;
      humanQueryCounts.set(
        row.queryText,
        (humanQueryCounts.get(row.queryText) ?? 0) + 1,
      );
    }

    if (isToday) {
      if (label === "Known Supplier") knownSuppliersToday += 1;
      if (label === "Returning Visitor") returningToday += 1;
      if (label === "Unclassified") unclassifiedToday += 1;
      if (isBotVisitor(label)) {
        botSearchesToday += 1;
        if (label === "Google Search Bot") googleToday += 1;
        if (label === "Microsoft Search Bot") microsoftToday += 1;
        if (label === "Meta AI") metaToday += 1;
        if (label === "Unknown Scraper") {
          unknownScrapersToday += 1;
          if (row.ipAddress) {
            unknownScraperIpCounts.set(
              row.ipAddress,
              (unknownScraperIpCounts.get(row.ipAddress) ?? 0) + 1,
            );
          }
        }
        if (isClaimedSearchEngineCrawler(label)) {
          claimedSearchEngineToday += 1;
        }
      }
    }
  }

  const topHumanQueries = [...humanQueryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([queryText, count]) => ({ queryText, count }));

  const topUnknownScraperIps = [...unknownScraperIpCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([ipAddress, count]) => ({ ipAddress, count }));

  const recentIpCounts = new Map<string, number>();
  for (const row of recentRows) {
    if (!row.ipAddress) continue;
    recentIpCounts.set(
      row.ipAddress,
      (recentIpCounts.get(row.ipAddress) ?? 0) + 1,
    );
  }

  return {
    business: {
      humanSearchesToday,
      humanSearchesLast7Days,
      knownSuppliersToday,
      returningToday,
      rfqsToday,
      humanSearchConversion: ratio(rfqsToday, humanSearchesToday),
      byModeHuman30d,
      topHumanQueries,
    },
    crawl: {
      botSearchesToday,
      googleToday,
      microsoftToday,
      metaToday,
      unknownScrapersToday,
      claimedSearchEngineToday,
      crawlerDiscovery: ratio(claimedSearchEngineToday, botSearchesToday),
      unclassifiedToday,
      topUnknownScraperIps,
    },
    totals: {
      today,
      last7Days,
      last30Days,
    },
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
