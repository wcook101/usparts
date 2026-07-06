import type { PartCategory, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { ListingWithCompany } from "@/lib/listings";
import {
  getAllManufacturerProfiles,
  getManufacturerProfile,
  getManufacturerSearchPath,
  type ManufacturerProfile,
} from "@/lib/manufacturers/catalog";
import { getPartPagePath } from "@/lib/parts/part-path";

export type ManufacturerPartSummary = {
  mpn: string;
  mpnNormalized: string;
  listingCount: number;
  totalQuantity: number;
  lowestPrice: number | null;
};

export type ManufacturerCategoryCount = {
  category: PartCategory;
  count: number;
};

export type ManufacturerPageData = {
  profile: ManufacturerProfile;
  searchPath: string;
  listingCount: number;
  partCount: number;
  supplierCount: number;
  totalQuantity: number;
  topParts: ManufacturerPartSummary[];
  categoryCounts: ManufacturerCategoryCount[];
  recentListings: ListingWithCompany[];
  lastUpdated: Date | null;
};

export type ManufacturerIndexEntry = {
  profile: ManufacturerProfile;
  listingCount: number;
  partCount: number;
};

export function buildManufacturerWhere(
  profile: ManufacturerProfile,
): Prisma.PartListingWhereInput {
  const aliasFilters: Prisma.PartListingWhereInput[] = profile.aliases.map(
    (alias) => ({
      manufacturer: { contains: alias, mode: "insensitive" as const },
    }),
  );

  const exactFilters: Prisma.PartListingWhereInput[] = (
    profile.exactAliases ?? []
  ).map((alias) => ({
    manufacturer: { equals: alias, mode: "insensitive" as const },
  }));

  return {
    isActive: true,
    OR: [...aliasFilters, ...exactFilters],
  };
}

export async function getManufacturerIndexEntries(): Promise<ManufacturerIndexEntry[]> {
  const profiles = getAllManufacturerProfiles();

  const entries = await Promise.all(
    profiles.map(async (profile) => {
      const where = buildManufacturerWhere(profile);
      const [listingCount, partGroups] = await Promise.all([
        db.partListing.count({ where }),
        db.partListing.groupBy({
          by: ["mpnNormalized"],
          where,
          _count: { id: true },
        }),
      ]);

      return {
        profile,
        listingCount,
        partCount: partGroups.length,
      };
    }),
  );

  return entries.sort((a, b) => b.listingCount - a.listingCount);
}

export async function getManufacturerPageData(
  slug: string,
): Promise<ManufacturerPageData | null> {
  const profile = getManufacturerProfile(slug);
  if (!profile) {
    return null;
  }

  const where = buildManufacturerWhere(profile);

  const [listingCount, allPartGroups, topPartGroups, quantityAgg, categoryGroups, supplierGroups, recentListings] =
    await Promise.all([
      db.partListing.count({ where }),
      db.partListing.groupBy({
        by: ["mpnNormalized"],
        where,
        _count: { id: true },
      }),
      db.partListing.groupBy({
        by: ["mpnNormalized"],
        where,
        _count: { id: true },
        _sum: { quantity: true },
        orderBy: { _count: { id: "desc" } },
        take: 24,
      }),
      db.partListing.aggregate({
        where,
        _sum: { quantity: true },
      }),
      db.partListing.groupBy({
        by: ["category"],
        where,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      db.partListing.groupBy({
        by: ["companyId"],
        where,
      }),
      db.partListing.findMany({
        where,
        include: {
          company: true,
          inventoryLocation: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 25,
      }),
    ]);

  const topNormalized = topPartGroups.map((group) => group.mpnNormalized);
  const canonicalListings =
    topNormalized.length > 0
      ? await db.partListing.findMany({
          where: {
            isActive: true,
            mpnNormalized: { in: topNormalized },
          },
          select: {
            mpn: true,
            mpnNormalized: true,
            price: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
        })
      : [];

  const canonicalMpnByNormalized = new Map<string, string>();
  const lowestPriceByNormalized = new Map<string, number>();
  let lastUpdated: Date | null = null;

  for (const listing of canonicalListings) {
    if (!canonicalMpnByNormalized.has(listing.mpnNormalized)) {
      canonicalMpnByNormalized.set(listing.mpnNormalized, listing.mpn);
    }

    if (listing.price) {
      const price = Number(listing.price);
      if (price > 0) {
        const current = lowestPriceByNormalized.get(listing.mpnNormalized);
        if (current === undefined || price < current) {
          lowestPriceByNormalized.set(listing.mpnNormalized, price);
        }
      }
    }

    if (!lastUpdated || listing.updatedAt > lastUpdated) {
      lastUpdated = listing.updatedAt;
    }
  }

  for (const listing of recentListings) {
    if (!lastUpdated || listing.updatedAt > lastUpdated) {
      lastUpdated = listing.updatedAt;
    }
  }

  const topParts: ManufacturerPartSummary[] = topPartGroups.map((group) => ({
    mpn: canonicalMpnByNormalized.get(group.mpnNormalized) ?? group.mpnNormalized,
    mpnNormalized: group.mpnNormalized,
    listingCount: group._count.id,
    totalQuantity: group._sum.quantity ?? 0,
    lowestPrice: lowestPriceByNormalized.get(group.mpnNormalized) ?? null,
  }));

  return {
    profile,
    searchPath: getManufacturerSearchPath(profile),
    listingCount,
    partCount: allPartGroups.length,
    supplierCount: supplierGroups.length,
    totalQuantity: quantityAgg._sum.quantity ?? 0,
    topParts,
    categoryCounts: categoryGroups.map((group) => ({
      category: group.category,
      count: group._count.id,
    })),
    recentListings,
    lastUpdated,
  };
}

export { getPartPagePath };
