import type { SearchIntelDimension } from "@/generated/prisma/client";
import { db } from "@/lib/db";

const DIMENSION_TITLES: Record<SearchIntelDimension, string> = {
  PART: "Top searched part numbers",
  MANUFACTURER: "Top searched manufacturers",
  CATEGORY: "Top searched categories",
  ZERO_RESULT_PART: "Hard-to-find (zero-result) parts",
  MILITARY_PART: "Most searched military / mil-spec parts",
  SUPPLIER_RFQ: "Most requested suppliers (RFQs)",
  RFQ_BY_MANUFACTURER: "RFQs by manufacturer",
  HUMAN_QUERY: "Human search trends",
  BOT_QUERY: "Bot search trends",
};

export function searchIntelDimensionTitle(dimension: SearchIntelDimension) {
  return DIMENSION_TITLES[dimension];
}

export async function getLatestSearchIntelDay() {
  return db.searchIntelDay.findFirst({
    orderBy: { day: "desc" },
  });
}

export async function getSearchIntelReport(options?: {
  day?: Date;
  limitPerDimension?: number;
}) {
  const limit = options?.limitPerDimension ?? 25;
  const dayRow = options?.day
    ? await db.searchIntelDay.findUnique({ where: { day: options.day } })
    : await getLatestSearchIntelDay();

  if (!dayRow) {
    return null;
  }

  const ranks = await db.searchIntelRank.findMany({
    where: { day: dayRow.day },
    orderBy: [{ dimension: "asc" }, { rank: "asc" }],
  });

  const byDimension = new Map<SearchIntelDimension, typeof ranks>();
  for (const row of ranks) {
    const list = byDimension.get(row.dimension) ?? [];
    if (list.length < limit) {
      list.push(row);
      byDimension.set(row.dimension, list);
    }
  }

  const recentDays = await db.searchIntelDay.findMany({
    orderBy: { day: "desc" },
    take: 14,
  });

  return {
    day: dayRow,
    recentDays,
    sections: (
      Object.keys(DIMENSION_TITLES) as SearchIntelDimension[]
    ).map((dimension) => ({
      dimension,
      title: DIMENSION_TITLES[dimension],
      rows: byDimension.get(dimension) ?? [],
    })),
  };
}
