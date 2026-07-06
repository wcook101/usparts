import type { PartCategory } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { ListingWithCompany } from "@/lib/listings";
import { normalizeMpn, parseSingleLetterPackageVariant, bulkQueryMatchesListing, isSingleLetterPackageVariantSibling } from "@/lib/mpn-normalize";
import { lookupAliasTargets } from "@/lib/part-aliases";
import { getPartPagePath } from "@/lib/parts/part-path";

export { getPartPagePath };

export type RelatedPart = {
  mpn: string;
  mpnNormalized: string;
  manufacturer: string | null;
  listingCount: number;
  reason: "alias" | "variant";
};

export type PartPageData = {
  mpn: string;
  queryMpn: string;
  mpnNormalized: string;
  matchType: "exact" | "prefix" | "family";
  canonicalRedirectPath: string | null;
  matchedMpns: string[];
  manufacturers: string[];
  primaryManufacturer: string | null;
  description: string | null;
  datasheetUrl: string | null;
  category: PartCategory | null;
  listings: ListingWithCompany[];
  totalQuantity: number;
  pricedListingCount: number;
  lowestPrice: number | null;
  highestPrice: number | null;
  supplierCount: number;
  relatedParts: RelatedPart[];
  lastUpdated: Date;
};

function pickCanonicalMpn(listings: ListingWithCompany[]): string {
  const counts = new Map<string, number>();
  for (const listing of listings) {
    counts.set(listing.mpn, (counts.get(listing.mpn) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? listings[0]!.mpn;
}

function pickPrimaryDescription(listings: ListingWithCompany[]): string | null {
  const descriptions = listings
    .map((listing) => listing.description?.trim())
    .filter((value): value is string => Boolean(value));

  if (descriptions.length === 0) {
    return null;
  }

  return descriptions.sort((a, b) => b.length - a.length)[0] ?? null;
}

function pickDatasheetUrl(listings: ListingWithCompany[]): string | null {
  for (const listing of listings) {
    const url = listing.datasheetUrl?.trim();
    if (url) {
      return url;
    }
  }
  return null;
}

function pickCategory(listings: ListingWithCompany[]): PartCategory | null {
  const counts = new Map<PartCategory, number>();
  for (const listing of listings) {
    counts.set(listing.category, (counts.get(listing.category) ?? 0) + 1);
  }

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top?.[0] ?? null;
}

async function getDisplayMpnForNormalized(
  mpnNormalized: string,
): Promise<{ mpn: string; manufacturer: string | null; listingCount: number } | null> {
  const listing = await db.partListing.findFirst({
    where: { isActive: true, mpnNormalized },
    select: { mpn: true, manufacturer: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!listing) {
    return null;
  }

  const listingCount = await db.partListing.count({
    where: { isActive: true, mpnNormalized },
  });

  return {
    mpn: listing.mpn,
    manufacturer: listing.manufacturer,
    listingCount,
  };
}

async function getRelatedParts(
  mpnNormalized: string,
  limit = 8,
): Promise<RelatedPart[]> {
  const related = new Map<string, RelatedPart>();

  const aliasMap = await lookupAliasTargets([mpnNormalized]);
  const aliasTargets = aliasMap.get(mpnNormalized) ?? [];

  for (const target of aliasTargets) {
    if (target.inventoryMpn === mpnNormalized) {
      continue;
    }

    const display = await getDisplayMpnForNormalized(target.inventoryMpn);
    if (!display) {
      continue;
    }

    related.set(target.inventoryMpn, {
      mpn: display.mpn,
      mpnNormalized: target.inventoryMpn,
      manufacturer: target.manufacturer ?? display.manufacturer,
      listingCount: display.listingCount,
      reason: "alias",
    });
  }

  // Only true package suffix siblings (e.g. NE555N ↔ NE555P), not shared catalog prefixes.
  const packageVariant = parseSingleLetterPackageVariant(mpnNormalized);
  if (packageVariant) {
    const candidates = await db.partListing.groupBy({
      by: ["mpnNormalized"],
      where: {
        isActive: true,
        mpnNormalized: { startsWith: packageVariant.base },
        NOT: { mpnNormalized },
      },
      _count: { id: true },
    });

    for (const candidate of candidates.sort((a, b) => b._count.id - a._count.id)) {
      if (related.size >= limit) {
        break;
      }

      if (
        related.has(candidate.mpnNormalized) ||
        !isSingleLetterPackageVariantSibling(mpnNormalized, candidate.mpnNormalized)
      ) {
        continue;
      }

      const display = await getDisplayMpnForNormalized(candidate.mpnNormalized);
      if (!display) {
        continue;
      }

      related.set(candidate.mpnNormalized, {
        mpn: display.mpn,
        mpnNormalized: candidate.mpnNormalized,
        manufacturer: display.manufacturer,
        listingCount: display.listingCount,
        reason: "variant",
      });
    }
  }

  return [...related.values()].slice(0, limit);
}

const listingInclude = { company: true, inventoryLocation: true } as const;
const listingOrder = [
  { price: "asc" as const },
  { quantity: "desc" as const },
  { updatedAt: "desc" as const },
];

async function findListingsForPartQuery(normalized: string): Promise<{
  listings: ListingWithCompany[];
  matchType: "exact" | "prefix" | "family";
}> {
  const exact = (await db.partListing.findMany({
    where: { isActive: true, mpnNormalized: normalized },
    include: listingInclude,
    orderBy: listingOrder,
  })) as ListingWithCompany[];

  if (exact.length > 0) {
    return { listings: exact, matchType: "exact" };
  }

  if (normalized.length < 3) {
    return { listings: [], matchType: "exact" };
  }

  const prefixMatches = (await db.partListing.findMany({
    where: { isActive: true, mpnNormalized: { startsWith: normalized } },
    include: listingInclude,
    orderBy: listingOrder,
    take: 100,
  })) as ListingWithCompany[];

  if (prefixMatches.length > 0) {
    const distinct = new Set(prefixMatches.map((listing) => listing.mpnNormalized));
    return {
      listings: prefixMatches,
      matchType: distinct.size === 1 ? "prefix" : "family",
    };
  }

  const broadCandidates = (await db.partListing.findMany({
    where: {
      isActive: true,
      mpnNormalized: { startsWith: normalized.slice(0, 3) },
    },
    include: listingInclude,
    take: 250,
  })) as ListingWithCompany[];

  const matched = broadCandidates.filter((listing) =>
    bulkQueryMatchesListing(normalized, listing.mpnNormalized),
  );

  if (matched.length > 0) {
    matched.sort((a, b) => {
      if (a.mpnNormalized === b.mpnNormalized) {
        return b.quantity - a.quantity;
      }
      return a.mpnNormalized.localeCompare(b.mpnNormalized);
    });

    const distinct = new Set(matched.map((listing) => listing.mpnNormalized));
    return {
      listings: matched,
      matchType: distinct.size === 1 ? "prefix" : "family",
    };
  }

  return { listings: [], matchType: "exact" };
}

function buildPartPageData(
  decoded: string,
  normalized: string,
  listings: ListingWithCompany[],
  matchType: "exact" | "prefix" | "family",
): PartPageData {
  const mpn = pickCanonicalMpn(listings);
  const matchedMpns = [...new Set(listings.map((listing) => listing.mpn))].sort();
  const distinctNormalized = new Set(listings.map((listing) => listing.mpnNormalized));
  const manufacturers = [
    ...new Set(
      listings.map((listing) => listing.manufacturer.trim()).filter(Boolean),
    ),
  ];
  const prices = listings
    .map((listing) => (listing.price ? Number(listing.price) : null))
    .filter((price): price is number => price !== null && price > 0);

  const totalQuantity = listings.reduce((sum, listing) => sum + listing.quantity, 0);
  const supplierCount = new Set(listings.map((listing) => listing.companyId)).size;
  const canonicalMpnNormalized = [...distinctNormalized][0] ?? normalized;

  const shouldRedirect =
    matchType === "prefix" &&
    distinctNormalized.size === 1 &&
    normalizeMpn(decoded) !== canonicalMpnNormalized &&
    normalizeMpn(mpn) === canonicalMpnNormalized;

  return {
    mpn,
    queryMpn: decoded,
    mpnNormalized: canonicalMpnNormalized,
    matchType,
    canonicalRedirectPath: shouldRedirect ? getPartPagePath(mpn) : null,
    matchedMpns,
    manufacturers,
    primaryManufacturer: manufacturers[0] ?? null,
    description: pickPrimaryDescription(listings),
    datasheetUrl: pickDatasheetUrl(listings),
    category: pickCategory(listings),
    listings,
    totalQuantity,
    pricedListingCount: prices.length,
    lowestPrice: prices.length > 0 ? Math.min(...prices) : null,
    highestPrice: prices.length > 0 ? Math.max(...prices) : null,
    supplierCount,
    relatedParts: [],
    lastUpdated: listings[0]?.updatedAt ?? new Date(),
  };
}

export async function getPartPageData(mpnSlug: string): Promise<PartPageData | null> {
  const decoded = decodeURIComponent(mpnSlug).trim();
  const normalized = normalizeMpn(decoded);

  if (!normalized || normalized.length < 2) {
    return null;
  }

  const { listings, matchType } = await findListingsForPartQuery(normalized);

  if (listings.length === 0) {
    return null;
  }

  const part = buildPartPageData(decoded, normalized, listings, matchType);
  part.relatedParts = await getRelatedParts(part.mpnNormalized);

  return part;
}

export async function getPartPageDataWithoutRedirect(
  mpnSlug: string,
): Promise<PartPageData | null> {
  const part = await getPartPageData(mpnSlug);
  if (!part) {
    return null;
  }

  return { ...part, canonicalRedirectPath: null };
}

export type PartSitemapEntry = {
  mpn: string;
  lastModified: Date;
};

export async function getPartSitemapEntries(limit = 5000): Promise<PartSitemapEntry[]> {
  const groups = await db.partListing.groupBy({
    by: ["mpnNormalized"],
    where: { isActive: true },
    _count: { id: true },
  });

  groups.sort((a, b) => b._count.id - a._count.id);
  const topGroups = groups.slice(0, limit);
  const normalizedMpns = topGroups.map((group) => group.mpnNormalized);

  if (normalizedMpns.length === 0) {
    return [];
  }

  const listings = await db.partListing.findMany({
    where: {
      isActive: true,
      mpnNormalized: { in: normalizedMpns },
    },
    select: {
      mpn: true,
      mpnNormalized: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const canonicalByNormalized = new Map<string, PartSitemapEntry>();

  for (const listing of listings) {
    const existing = canonicalByNormalized.get(listing.mpnNormalized);
    if (!existing || listing.updatedAt > existing.lastModified) {
      canonicalByNormalized.set(listing.mpnNormalized, {
        mpn: listing.mpn,
        lastModified: listing.updatedAt,
      });
    }
  }

  return topGroups
    .map((group) => canonicalByNormalized.get(group.mpnNormalized))
    .filter((entry): entry is PartSitemapEntry => entry !== undefined);
}

export async function getTopPartPages(limit = 12): Promise<PartSitemapEntry[]> {
  return getPartSitemapEntries(limit);
}
