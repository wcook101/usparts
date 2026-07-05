import type { Prisma, PartCategory, PartCondition } from "@/generated/prisma/client";
import type { Company, InventoryLocation, PartListing } from "@/generated/prisma/client";
import type { BulkSearchInput, SearchQuery } from "@/lib/validations";
import { MAX_BULK_SEARCH_PARTS } from "@/lib/validations";
import { db } from "@/lib/db";
import { aliasMatchesListing, lookupAliasTargets } from "@/lib/part-aliases";
import { normalizeMpn, parseMpnList, bulkQueryMatchesListing, buildQueryPrefixSet, parseSingleLetterPackageVariant, isSingleLetterPackageVariantSibling } from "@/lib/mpn-normalize";

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

function looksLikePartNumberQuery(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return false;
  }

  return /^[A-Za-z0-9][A-Za-z0-9./+#_-]*$/.test(trimmed);
}

async function countListingsCapped(
  where: Prisma.PartListingWhereInput,
  cap = MAX_SEARCH_RESULTS,
): Promise<number> {
  const rows = await db.partListing.findMany({
    where,
    select: { id: true },
    take: cap + 1,
  });

  return rows.length > cap ? cap : rows.length;
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
      ? normalizedQuery.length >= 2 && looksLikePartNumberQuery(trimmedQuery)
        ? {
            OR: [
              { mpnNormalized: { startsWith: normalizedQuery } },
              { mpnNormalized: normalizedQuery },
            ],
          }
        : normalizedQuery.length >= 2
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

  const variantMissedRows = rows.filter((row) => !row.found);
  if (variantMissedRows.length > 0) {
    const familyBases = [
      ...new Set(
        variantMissedRows
          .map((row) => parseSingleLetterPackageVariant(row.normalizedMpn)?.base)
          .filter((base): base is string => Boolean(base)),
      ),
    ];

    if (familyBases.length > 0) {
      const variantListings = await db.partListing.findMany({
        where: {
          isActive: true,
          OR: familyBases.map((base) => ({
            mpnNormalized: { startsWith: base },
          })),
          ...(category ? { category: category as Prisma.EnumPartCategoryFilter["equals"] } : {}),
          ...(manufacturer
            ? { manufacturer: { contains: manufacturer, mode: "insensitive" } }
            : {}),
        },
        include: { company: true, inventoryLocation: true },
        orderBy: [{ mpnNormalized: "asc" }, { quantity: "desc" }, { updatedAt: "desc" }],
      });

      for (const row of variantMissedRows) {
        const matched = variantListings.filter((listing) =>
          isSingleLetterPackageVariantSibling(row.normalizedMpn, listing.mpnNormalized),
        );

        if (matched.length === 0) {
          continue;
        }

        row.found = true;
        row.matchType = "ALTERNATE";
        row.alternateFor = row.input;
        row.matchedViaMpn = matched[0]?.mpnNormalized;
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
  const companies = await db.company.findMany({
    where: {
      listings: { some: { isActive: true } },
    },
    orderBy: [{ lastImportAt: "desc" }, { updatedAt: "desc" }],
    take: companyLimit,
  });

  if (companies.length === 0) {
    return [];
  }

  const groups = await Promise.all(
    companies.map(async (company) => {
      const listings = await db.partListing.findMany({
        where: {
          companyId: company.id,
          isActive: true,
        },
        include: { company: true, inventoryLocation: true },
        orderBy: { updatedAt: "desc" },
        take: perCompanyLimit,
      });

      if (listings.length === 0) {
        return null;
      }

      return {
        company,
        listings,
        lastUploadedAt:
          listings[0]?.updatedAt ?? company.lastImportAt ?? company.updatedAt,
      };
    }),
  );

  return groups.filter((group): group is CompanyRecentListings => group !== null);
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
    countListingsCapped(where),
  ]);

  let resolvedListings = listings;
  let resolvedTotal = totalCount;

  const normalizedQuery = q?.trim() ? normalizeMpn(q.trim()) : "";
  if (normalizedQuery && totalCount === 0) {
    const family = parseSingleLetterPackageVariant(normalizedQuery);
    if (family) {
      const variantCandidates = await db.partListing.findMany({
        where: {
          isActive: true,
          mpnNormalized: { startsWith: family.base },
          ...(category ? { category: category as Prisma.EnumPartCategoryFilter["equals"] } : {}),
          ...(manufacturer
            ? { manufacturer: { contains: manufacturer, mode: "insensitive" } }
            : {}),
        },
        include: { company: true, inventoryLocation: true },
        orderBy: [{ quantity: "desc" }, { updatedAt: "desc" }],
        take: limit,
      });

      const siblings = variantCandidates.filter((listing) =>
        isSingleLetterPackageVariantSibling(normalizedQuery, listing.mpnNormalized),
      );

      if (siblings.length > 0) {
        resolvedListings = siblings;
        resolvedTotal = siblings.length;
      }
    }
  }

  const total = Math.min(resolvedTotal, MAX_SEARCH_RESULTS);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    listings: resolvedListings,
    companyGroups: undefined,
    total,
    totalCount: resolvedTotal,
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

export type FeaturedSeller = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string;
  listingCount: number;
  sampleMpn: string | null;
};

export async function getFeaturedSellers(limit = 6): Promise<FeaturedSeller[]> {
  const companies = await db.company.findMany({
    where: {
      listings: { some: { isActive: true } },
    },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      country: true,
      listings: {
        where: { isActive: true },
        select: { mpn: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          listings: { where: { isActive: true } },
        },
      },
    },
    orderBy: {
      listings: {
        _count: "desc",
      },
    },
    take: limit,
  });

  return companies.map((company) => ({
    id: company.id,
    name: company.name,
    city: company.city,
    state: company.state,
    country: company.country,
    listingCount: company._count.listings,
    sampleMpn: company.listings[0]?.mpn ?? null,
  }));
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
