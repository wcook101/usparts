import type { PartCategory } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { ListingWithCompany } from "@/lib/listings";
import { normalizeMpn, parseSingleLetterPackageVariant } from "@/lib/mpn-normalize";
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
  mpnNormalized: string;
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

  const family = parseSingleLetterPackageVariant(mpnNormalized);
  const prefix = family?.base ?? mpnNormalized.slice(0, Math.min(6, mpnNormalized.length));

  if (prefix.length >= 3) {
    const variants = await db.partListing.groupBy({
      by: ["mpnNormalized"],
      where: {
        isActive: true,
        mpnNormalized: { startsWith: prefix },
        NOT: { mpnNormalized },
      },
      _count: { id: true },
    });

    for (const variant of variants.sort((a, b) => b._count.id - a._count.id).slice(0, limit)) {
      if (related.has(variant.mpnNormalized)) {
        continue;
      }

      const display = await getDisplayMpnForNormalized(variant.mpnNormalized);
      if (!display) {
        continue;
      }

      related.set(variant.mpnNormalized, {
        mpn: display.mpn,
        mpnNormalized: variant.mpnNormalized,
        manufacturer: display.manufacturer,
        listingCount: display.listingCount,
        reason: "variant",
      });
    }
  }

  return [...related.values()].slice(0, limit);
}

export async function getPartPageData(mpnSlug: string): Promise<PartPageData | null> {
  const decoded = decodeURIComponent(mpnSlug).trim();
  const normalized = normalizeMpn(decoded);

  if (!normalized || normalized.length < 2) {
    return null;
  }

  const listings = (await db.partListing.findMany({
    where: { isActive: true, mpnNormalized: normalized },
    include: { company: true, inventoryLocation: true },
    orderBy: [{ price: "asc" }, { quantity: "desc" }, { updatedAt: "desc" }],
  })) as ListingWithCompany[];

  if (listings.length === 0) {
    return null;
  }

  const mpn = pickCanonicalMpn(listings);
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
  const relatedParts = await getRelatedParts(normalized);

  return {
    mpn,
    mpnNormalized: normalized,
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
    relatedParts,
    lastUpdated: listings[0]?.updatedAt ?? new Date(),
  };
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
