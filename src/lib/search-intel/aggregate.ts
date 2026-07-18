import type { SearchIntelDimension, SearchMode } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { startOfTodayEastern } from "@/lib/datetime";
import { db } from "@/lib/db";
import { CATEGORY_LABELS } from "@/lib/format";
import {
  isMilitaryPart,
  parseSearchTerms,
  resolveManufacturerLabel,
} from "@/lib/search-intel/parse";
import {
  classifyVisitor,
  isBotVisitor,
  isHumanVisitor,
} from "@/lib/visitor-classify";

const TOP_N = 100;

type Counter = {
  key: string;
  label: string;
  searchCount: number;
  humanCount: number;
  botCount: number;
  zeroResultCount: number;
  rfqCount: number;
  listingCount: number;
};

function bump(
  map: Map<string, Counter>,
  key: string,
  label: string,
  patch: Partial<Counter>,
) {
  const existing = map.get(key) ?? {
    key,
    label,
    searchCount: 0,
    humanCount: 0,
    botCount: 0,
    zeroResultCount: 0,
    rfqCount: 0,
    listingCount: 0,
  };
  existing.searchCount += patch.searchCount ?? 0;
  existing.humanCount += patch.humanCount ?? 0;
  existing.botCount += patch.botCount ?? 0;
  existing.zeroResultCount += patch.zeroResultCount ?? 0;
  existing.rfqCount += patch.rfqCount ?? 0;
  if (typeof patch.listingCount === "number") {
    existing.listingCount = patch.listingCount;
  }
  if (label) existing.label = label;
  map.set(key, existing);
}

function topRanks(
  map: Map<string, Counter>,
  dimension: SearchIntelDimension,
  day: Date,
  sortBy: "searchCount" | "rfqCount" | "humanCount" | "botCount" = "searchCount",
) {
  return [...map.values()]
    .sort((a, b) => b[sortBy] - a[sortBy] || b.searchCount - a.searchCount)
    .slice(0, TOP_N)
    .map((row, index) => ({
      day,
      dimension,
      rank: index + 1,
      key: row.key.slice(0, 200),
      label: row.label.slice(0, 300),
      searchCount: row.searchCount,
      humanCount: row.humanCount,
      botCount: row.botCount,
      zeroResultCount: row.zeroResultCount,
      rfqCount: row.rfqCount,
      listingCount: row.listingCount,
    }));
}

/** Eastern calendar day containing `reference`, as a UTC Date suitable for @db.Date. */
export function easternDayDate(reference: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(reference);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day));
}

export function easternDayBounds(dayDate: Date): { start: Date; end: Date } {
  const start = startOfTodayEastern(
    new Date(dayDate.getTime() + 12 * 60 * 60 * 1000),
  );
  const end = startOfTodayEastern(
    new Date(start.getTime() + 36 * 60 * 60 * 1000),
  );
  return { start, end };
}

export function listEasternDaysInclusive(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  let cursor = easternDayDate(from);
  const end = easternDayDate(to);
  while (cursor.getTime() <= end.getTime()) {
    days.push(cursor);
    const nextRef = new Date(cursor.getTime() + 36 * 60 * 60 * 1000);
    cursor = easternDayDate(nextRef);
  }
  return days;
}

async function listingCountsForMpns(normalizedMpns: string[]) {
  const counts = new Map<string, number>();
  if (normalizedMpns.length === 0) return counts;

  const rows = await db.partListing.groupBy({
    by: ["mpnNormalized"],
    where: {
      isActive: true,
      mpnNormalized: { in: normalizedMpns },
    },
    _count: { _all: true },
  });

  for (const row of rows) {
    counts.set(row.mpnNormalized, row._count._all);
  }
  return counts;
}

export type AggregateDayResult = {
  day: string;
  searchesTotal: number;
  searchesHuman: number;
  ranksWritten: number;
};

export async function aggregateSearchIntelDay(
  dayDate: Date,
): Promise<AggregateDayResult> {
  const day = easternDayDate(dayDate);
  const { start, end } = easternDayBounds(day);

  const [events, rfqs] = await Promise.all([
    db.searchEvent.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: {
        mode: true,
        queryText: true,
        resultCount: true,
        manufacturer: true,
        category: true,
        userAgent: true,
        ipAddress: true,
        user: {
          select: {
            email: true,
            company: { select: { id: true } },
            memberships: { select: { id: true }, take: 1 },
          },
        },
      },
    }),
    db.quoteRequest.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: {
        id: true,
        listing: {
          select: {
            manufacturer: true,
            mpnNormalized: true,
            mpn: true,
            companyId: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  let searchesTotal = 0;
  let searchesHuman = 0;
  let searchesBot = 0;
  let searchesUnclassified = 0;
  let searchesSingleHuman = 0;
  let searchesBulkHuman = 0;
  let searchesSmartHuman = 0;
  let zeroResultHuman = 0;

  const parts = new Map<string, Counter>();
  const manufacturers = new Map<string, Counter>();
  const categories = new Map<string, Counter>();
  const zeroResultParts = new Map<string, Counter>();
  const militaryParts = new Map<string, Counter>();
  const humanQueries = new Map<string, Counter>();
  const botQueries = new Map<string, Counter>();
  const supplierRfqs = new Map<string, Counter>();
  const rfqByManufacturer = new Map<string, Counter>();

  const seenIp = new Set<string>();

  for (const event of events) {
    searchesTotal += 1;
    const label = classifyVisitor({
      userAgent: event.userAgent,
      ipAddress: event.ipAddress,
      isKnownSupplier: Boolean(
        event.user?.company || (event.user?.memberships.length ?? 0) > 0,
      ),
      isReturningVisitor: Boolean(
        event.ipAddress && seenIp.has(event.ipAddress),
      ),
    });
    if (event.ipAddress) seenIp.add(event.ipAddress);

    const human = isHumanVisitor(label);
    const bot = isBotVisitor(label);
    if (human) searchesHuman += 1;
    else if (bot) searchesBot += 1;
    else searchesUnclassified += 1;

    if (human) {
      if (event.mode === "SINGLE") searchesSingleHuman += 1;
      if (event.mode === "BULK") searchesBulkHuman += 1;
      if (event.mode === "SMART") searchesSmartHuman += 1;
      if (event.resultCount === 0) zeroResultHuman += 1;
    }

    const terms = parseSearchTerms({
      mode: event.mode as SearchMode,
      queryText: event.queryText,
      manufacturer: event.manufacturer,
      category: event.category,
    });

    const humanInc = human ? 1 : 0;
    const botInc = bot ? 1 : 0;
    const zeroInc = human && event.resultCount === 0 ? 1 : 0;

    for (const mpn of terms.mpns) {
      bump(parts, mpn.normalized, mpn.input, {
        searchCount: 1,
        humanCount: humanInc,
        botCount: botInc,
        zeroResultCount: zeroInc,
      });
      if (zeroInc) {
        bump(zeroResultParts, mpn.normalized, mpn.input, {
          searchCount: 1,
          humanCount: 1,
          zeroResultCount: 1,
        });
      }
      if (isMilitaryPart(mpn.normalized)) {
        bump(militaryParts, mpn.normalized, mpn.input, {
          searchCount: 1,
          humanCount: humanInc,
          botCount: botInc,
          zeroResultCount: zeroInc,
        });
      }
    }

    for (const mfrKey of terms.manufacturers) {
      bump(manufacturers, mfrKey, resolveManufacturerLabel(mfrKey), {
        searchCount: 1,
        humanCount: humanInc,
        botCount: botInc,
        zeroResultCount: zeroInc,
      });
    }

    for (const category of terms.categories) {
      const catLabel =
        CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;
      bump(categories, category, catLabel, {
        searchCount: 1,
        humanCount: humanInc,
        botCount: botInc,
      });
    }

    const queryKey = event.queryText.trim().slice(0, 200);
    if (queryKey) {
      if (human) {
        bump(humanQueries, queryKey, queryKey, {
          searchCount: 1,
          humanCount: 1,
          zeroResultCount: event.resultCount === 0 ? 1 : 0,
        });
      }
      if (bot) {
        bump(botQueries, queryKey, queryKey, {
          searchCount: 1,
          botCount: 1,
        });
      }
    }
  }

  for (const rfq of rfqs) {
    const company = rfq.listing.company;
    bump(supplierRfqs, company.id, company.name, {
      rfqCount: 1,
      searchCount: 0,
    });

    const mfrKey = rfq.listing.manufacturer
      ? parseSearchTerms({
          mode: "SINGLE",
          queryText: `mfr:${rfq.listing.manufacturer}`,
          manufacturer: rfq.listing.manufacturer,
        }).manufacturers[0]
      : null;
    if (mfrKey) {
      bump(rfqByManufacturer, mfrKey, resolveManufacturerLabel(mfrKey), {
        rfqCount: 1,
      });
      // Attach RFQs onto manufacturer search counters when present.
      const existing = manufacturers.get(mfrKey);
      if (existing) existing.rfqCount += 1;
    }

    if (rfq.listing.mpnNormalized) {
      const existing = parts.get(rfq.listing.mpnNormalized);
      if (existing) existing.rfqCount += 1;
    }
  }

  // Inventory snapshot for top demanded MPNs (parts + zero-result + military).
  const mpnKeys = [
    ...new Set([
      ...[...parts.keys()],
      ...[...zeroResultParts.keys()],
      ...[...militaryParts.keys()],
    ]),
  ];
  const inventory = await listingCountsForMpns(mpnKeys);
  for (const [key, count] of inventory) {
    for (const map of [parts, zeroResultParts, militaryParts]) {
      const row = map.get(key);
      if (row) row.listingCount = count;
    }
  }

  // Zero-result dimension: prefer human zero-result MPNs; if listingCount>0 still keep
  // (race / filter quirks). Sales pitch uses listingCount === 0.
  for (const row of zeroResultParts.values()) {
    row.listingCount = inventory.get(row.key) ?? 0;
  }

  const rfqsSubmitted = rfqs.length;
  const humanSearchConversion =
    searchesHuman > 0
      ? new Prisma.Decimal(rfqsSubmitted / searchesHuman)
      : null;

  const rankRows = [
    ...topRanks(parts, "PART", day, "humanCount"),
    ...topRanks(manufacturers, "MANUFACTURER", day, "humanCount"),
    ...topRanks(categories, "CATEGORY", day, "humanCount"),
    ...topRanks(zeroResultParts, "ZERO_RESULT_PART", day, "humanCount"),
    ...topRanks(militaryParts, "MILITARY_PART", day, "humanCount"),
    ...topRanks(supplierRfqs, "SUPPLIER_RFQ", day, "rfqCount"),
    ...topRanks(rfqByManufacturer, "RFQ_BY_MANUFACTURER", day, "rfqCount"),
    ...topRanks(humanQueries, "HUMAN_QUERY", day, "humanCount"),
    ...topRanks(botQueries, "BOT_QUERY", day, "botCount"),
  ];

  await db.$transaction(async (tx) => {
    await tx.searchIntelRank.deleteMany({ where: { day } });
    await tx.searchIntelDay.deleteMany({ where: { day } });

    await tx.searchIntelDay.create({
      data: {
        day,
        searchesTotal,
        searchesHuman,
        searchesBot,
        searchesUnclassified,
        searchesSingleHuman,
        searchesBulkHuman,
        searchesSmartHuman,
        zeroResultHuman,
        rfqsSubmitted,
        humanSearchConversion,
        builtAt: new Date(),
      },
    });

    if (rankRows.length > 0) {
      await tx.searchIntelRank.createMany({ data: rankRows });
    }
  });

  return {
    day: day.toISOString().slice(0, 10),
    searchesTotal,
    searchesHuman,
    ranksWritten: rankRows.length,
  };
}

export async function aggregateSearchIntelRange(options?: {
  /** Inclusive start (defaults to earliest SearchEvent day or today). */
  from?: Date;
  /** Inclusive end (defaults to yesterday Eastern, or today if none). */
  to?: Date;
  /** When true, include today (useful for admin backfill / first run). */
  includeToday?: boolean;
}) {
  const earliest = await db.searchEvent.findFirst({
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const todayStart = startOfTodayEastern();
  const defaultTo = options?.includeToday
    ? todayStart
    : new Date(todayStart.getTime() - 12 * 60 * 60 * 1000);

  const from = options?.from ?? earliest?.createdAt ?? todayStart;
  const to = options?.to ?? defaultTo;

  const days = listEasternDaysInclusive(from, to);
  const results: AggregateDayResult[] = [];
  for (const day of days) {
    results.push(await aggregateSearchIntelDay(day));
  }
  return results;
}
