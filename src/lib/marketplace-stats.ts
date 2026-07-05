import type { PartCategory } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type PlatformStats = {
  activeListings: number;
  activeSuppliers: number;
  categoriesWithStock: number;
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const [activeListings, activeSuppliers, categoryGroups] = await Promise.all([
    db.partListing.count({ where: { isActive: true } }),
    db.company.count({
      where: { listings: { some: { isActive: true } } },
    }),
    db.partListing.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { id: true },
    }),
  ]);

  return {
    activeListings,
    activeSuppliers,
    categoriesWithStock: categoryGroups.length,
  };
}

export type CategoryListingCount = {
  category: PartCategory;
  count: number;
};

export async function getCategoryListingCounts(): Promise<CategoryListingCount[]> {
  const groups = await db.partListing.groupBy({
    by: ["category"],
    where: { isActive: true },
    _count: { id: true },
  });

  return groups
    .map((group) => ({
      category: group.category,
      count: group._count.id,
    }))
    .sort((a, b) => b.count - a.count);
}
