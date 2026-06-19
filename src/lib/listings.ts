import type { Prisma, PartCategory, PartCondition } from "@/generated/prisma/client";
import type { Company, InventoryLocation, PartListing } from "@/generated/prisma/client";
import type { BulkSearchInput, SearchQuery } from "@/lib/validations";
import { MAX_BULK_SEARCH_PARTS } from "@/lib/validations";
import { db } from "@/lib/db";
import { aliasMatchesListing, lookupAliasTargets } from "@/lib/part-aliases";
import { normalizeMpn, parseMpnList, bulkQueryMatchesListing, buildQueryPrefixSet } from "@/lib/mpn-normalize";

export const RECENT_COMPANIES_LIMIT = 10;
export const RECENT_LISTINGS_PER_COMPANY = 10;
export const MAX_SEARCH_RESULTS = 100;

export type ListingWithCompany = PartListing & {
  company: Company;
  inventoryLocation: InventoryLocation;
};

export type CompanyRecentListings = {
  company: Company;
  listings: ListingWithCompany[];
  lastUploadedAt: Date;
};

export function hasSearchCriteria(query: Pick<SearchQuery, "q" | "manufacturer" | "category">) {
  return Boolean(query.q?.trim() || query.manufacturer?.trim() || query.category?.trim());
}

function buildSearchFilters(
  query: Pick<SearchQuery, "q" | "manufacturer" | "category">,
): Prisma.PartListingWhereInput {
  const trimmedQuery = query.q?.trim();
  const normalizedQuery = trimmedQuery ? normalizeMpn(trimmedQuery) : "";
  const category = query.category?.trim();
  const manufacturer = query.manufacturer?.trim();

  return {
    isActive: true,
    ...(category ? { category: category as Prisma.EnumPartCategoryFilter["equals"] } : {}),
    ...(manufacturer
      ? { manufacturer: { contains: manufacturer, mode: "insensitive" } }
      : {}),
    ...(trimmedQuery
      ? normalizedQuery.length >= 2
        ? {
            OR: [
              { mpnNormalized: { startsWith: normalizedQuery } },
              { mpnNormalized: normalizedQuery },
              { mpn: { contains: trimmedQuery, mode: "insensitive" } },
              { manufacturer: { contains: trimmedQuery, mode: "insensitive" } },
              { description: { contains: trimmedQuery, mode: "insensitive" } },
            ],
          }
        : {
            OR: [
              { mpn: { contains: trimmedQuery, mode: "insensitive" } },
              { manufacturer: { contains: trimmedQuery, mode: "insensitive" } },
              { description: { contains: trimmedQuery, mode: "insensitive" } },
            ],
          }
      : {}),
  };
}

export type BulkSearchMatchType = "EXACT" | "ALTERNATE";

export type BulkSearchRow = {
  input: string;
  normalizedMpn: string;
  found: boolean;
  matchType?: BulkSearchMatchType;
  alternateFor?: string;
  matchedViaMpn?: string;
  listings: ListingWithCompany[];
};

export type BulkSearchResult = {
  rows: BulkSearchRow[];
  queriedCount: number;
  foundPartCount: number;
  notFoundPartCount: number;
  totalListingCount: number;
  durationMs: number;
};

export async function bulkSearchListings(
  input: BulkSearchInput,
): Promise<BulkSearchResult> {
  const startedAt = Date.now();
  const entries = parseMpnList(input.mpns).slice(0, MAX_BULK_SEARCH_PARTS);

  if (entries.length === 0) {
    return {
      rows: [],
      queriedCount: 0,
      foundPartCount: 0,
      notFoundPartCount: 0,
      totalListingCount: 0,
      durationMs: Date.now() - startedAt,
    };
  }

  const normalizedMpns = entries.map((entry) => entry.normalized);
  const category = input.category?.trim();
  const manufacturer = input.manufacturer?.trim();
  const queryPrefixes = buildQueryPrefixSet(normalizedMpns);

  const listings = await db.partListing.findMany({
    where: {
      isActive: true,
      OR: [
        ...normalizedMpns.map((term) => ({
          mpnNormalized: { startsWith: term },
        })),
        ...(queryPrefixes.length > 0
          ? [{ mpnNormalized: { in: queryPrefixes } }]
          : []),
      ],
      ...(category ? { category: category as Prisma.EnumPartCategoryFilter["equals"] } : {}),
      ...(manufacturer
        ? { manufacturer: { contains: manufacturer, mode: "insensitive" } }
        : {}),
    },
    include: { company: true, inventoryLocation: true },
    orderBy: [{ mpnNormalized: "asc" }, { quantity: "desc" }, { updatedAt: "desc" }],
  });

  let foundPartCount = 0;
  let totalListingCount = 0;

  const rows: BulkSearchRow[] = entries.map((entry) => {
    const matched = listings.filter((listing) =>
      bulkQueryMatchesListing(entry.normalized, listing.mpnNormalized),
    );
    if (matched.length > 0) {
      foundPartCount += 1;
      totalListingCount += matched.length;
    }

    return {
      input: entry.input,
      normalizedMpn: entry.normalized,
      found: matched.length > 0,
      matchType: matched.length > 0 ? "EXACT" : undefined,
      listings: matched,
    };
  });

  const missedRows = rows.filter((row) => !row.found);
  if (missedRows.length > 0) {
    const aliasTargets = await lookupAliasTargets(
      missedRows.map((row) => row.normalizedMpn),
    );

    const inventoryMpns = [
      ...new Set(
        [...aliasTargets.values()].flatMap((targets) =>
          targets.map((target) => target.inventoryMpn),
        ),
      ),
    ];

    if (inventoryMpns.length > 0) {
      const aliasListings = await db.partListing.findMany({
        where: {
          isActive: true,
          mpnNormalized: { in: inventoryMpns },
          ...(category ? { category: category as Prisma.EnumPartCategoryFilter["equals"] } : {}),
          ...(manufacturer
            ? { manufacturer: { contains: manufacturer, mode: "insensitive" } }
            : {}),
        },
        include: { company: true, inventoryLocation: true },
        orderBy: [{ mpnNormalized: "asc" }, { quantity: "desc" }, { updatedAt: "desc" }],
      });

      for (const row of missedRows) {
        const targets = aliasTargets.get(row.normalizedMpn) ?? [];
        if (targets.length === 0) {
          continue;
        }

        const matched = aliasListings.filter((listing) =>
          targets.some((target) => aliasMatchesListing(listing, target)),
        );

        if (matched.length === 0) {
          continue;
        }

        const bestTarget =
          targets.find((target) =>
            matched.some((listing) => aliasMatchesListing(listing, target)),
          ) ?? targets[0];

        row.found = true;
        row.matchType = "ALTERNATE";
        row.alternateFor = row.input;
        row.matchedViaMpn = bestTarget.inventoryMpn;
        row.listings = matched;
        foundPartCount += 1;
        totalListingCount += matched.length;
      }
    }
  }

  return {
    rows,
    queriedCount: entries.length,
    foundPartCount,
    notFoundPartCount: entries.length - foundPartCount,
    totalListingCount,
    durationMs: Date.now() - startedAt,
  };
}

export async function getRecentListingsByCompany(
  companyLimit = RECENT_COMPANIES_LIMIT,
  perCompanyLimit = RECENT_LISTINGS_PER_COMPANY,
): Promise<CompanyRecentListings[]> {
  const recentCompanies = await db.partListing.groupBy({
    by: ["companyId"],
    where: { isActive: true },
    _max: { updatedAt: true },
    orderBy: { _max: { updatedAt: "desc" } },
    take: companyLimit,
  });

  if (recentCompanies.length === 0) {
    return [];
  }

  const companyIds = recentCompanies.map((row) => row.companyId);
  const companies = await db.company.findMany({
    where: { id: { in: companyIds } },
  });
  const companyMap = new Map(companies.map((company) => [company.id, company]));

  const listings = await db.partListing.findMany({
    where: {
      isActive: true,
      companyId: { in: companyIds },
    },
    include: { company: true, inventoryLocation: true },
    orderBy: { updatedAt: "desc" },
  });

  const listingsByCompany = new Map<string, ListingWithCompany[]>();
  for (const listing of listings) {
    const bucket = listingsByCompany.get(listing.companyId) ?? [];
    if (bucket.length < perCompanyLimit) {
      bucket.push(listing);
      listingsByCompany.set(listing.companyId, bucket);
    }
  }

  return recentCompanies.flatMap((row) => {
    const company = companyMap.get(row.companyId);
    const companyListings = listingsByCompany.get(row.companyId) ?? [];
    const lastUploadedAt = row._max.updatedAt;

    if (!company || !lastUploadedAt || companyListings.length === 0) {
      return [];
    }

    return [
      {
        company,
        listings: companyListings,
        lastUploadedAt,
      },
    ];
  });
}

export async function searchListings(query: SearchQuery) {
  const { q, manufacturer, category, page, limit } = query;

  if (!hasSearchCriteria(query)) {
    const companyGroups = await getRecentListingsByCompany();
    const listings = companyGroups.flatMap((group) => group.listings);

    return {
      listings,
      companyGroups,
      total: listings.length,
      totalCount: listings.length,
      page: 1,
      limit,
      totalPages: 1,
      recentOnly: true,
    };
  }

  const where = buildSearchFilters({ q, manufacturer, category });

  const maxPages = Math.max(1, Math.ceil(MAX_SEARCH_RESULTS / limit));
  const effectivePage = Math.min(page, maxPages);
  const skip = (effectivePage - 1) * limit;

  const [listings, totalCount] = await Promise.all([
    db.partListing.findMany({
      where,
      include: { company: true, inventoryLocation: true },
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: limit,
    }),
    db.partListing.count({ where }),
  ]);

  const total = Math.min(totalCount, MAX_SEARCH_RESULTS);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    listings,
    companyGroups: undefined,
    total,
    totalCount,
    page: effectivePage,
    limit,
    totalPages,
    recentOnly: false,
  };
}

export async function getListingById(id: string) {
  return db.partListing.findUnique({
    where: { id },
    include: { company: true, inventoryLocation: true },
  });
}

export async function getRecentListings() {
  return getRecentListingsByCompany(RECENT_COMPANIES_LIMIT, RECENT_LISTINGS_PER_COMPANY);
}

export async function getCompanies() {
  return db.company.findMany({
    include: {
      _count: { select: { listings: { where: { isActive: true } } } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getListingsForCompany(
  companyId: string,
  options?: { includeInactive?: boolean },
) {
  return db.partListing.findMany({
    where: {
      companyId,
      ...(options?.includeInactive ? {} : { isActive: true }),
    },
    include: { company: true, inventoryLocation: true },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });
}

export async function updateListingForCompany(
  companyId: string,
  listingId: string,
  input: {
    mpn?: string;
    manufacturer?: string;
    description?: string | null;
    category?: PartCategory;
    quantity?: number;
    price?: number | null;
    currency?: string;
    condition?: PartCondition;
    dateCode?: string | null;
    leadTimeDays?: number | null;
    inventoryLocationId?: string;
    datasheetUrl?: string | null;
    isActive?: boolean;
  },
) {
  const existing = await db.partListing.findFirst({
    where: { id: listingId, companyId },
  });

  if (!existing) {
    throw new Error("Listing not found");
  }

  if (input.inventoryLocationId) {
    const location = await db.inventoryLocation.findFirst({
      where: {
        id: input.inventoryLocationId,
        companyId,
      },
    });

    if (!location) {
      throw new Error("Select a valid inventory location for this company");
    }
  }

  return db.partListing.update({
    where: { id: listingId },
    data: {
      ...(input.mpn !== undefined
        ? { mpn: input.mpn, mpnNormalized: normalizeMpn(input.mpn) }
        : {}),
      ...(input.manufacturer !== undefined
        ? { manufacturer: input.manufacturer }
        : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.condition !== undefined ? { condition: input.condition } : {}),
      ...(input.dateCode !== undefined ? { dateCode: input.dateCode } : {}),
      ...(input.leadTimeDays !== undefined
        ? { leadTimeDays: input.leadTimeDays }
        : {}),
      ...(input.inventoryLocationId !== undefined
        ? { inventoryLocationId: input.inventoryLocationId }
        : {}),
      ...(input.datasheetUrl !== undefined
        ? { datasheetUrl: input.datasheetUrl }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    include: { company: true, inventoryLocation: true },
  });
}
