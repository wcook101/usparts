import type { DatasheetSource } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { normalizeDatasheetUrl } from "@/lib/datasheet";
import { normalizeMpn } from "@/lib/mpn-normalize";

export type DatasheetCatalogEntry = {
  mpnNormalized: string;
  mpn: string;
  manufacturer: string | null;
  datasheetUrl: string;
  source: DatasheetSource;
};

export async function getCatalogDatasheet(
  mpnNormalized: string,
): Promise<DatasheetCatalogEntry | null> {
  const row = await db.partDatasheet.findUnique({
    where: { mpnNormalized },
  });

  if (!row) {
    return null;
  }

  return {
    mpnNormalized: row.mpnNormalized,
    mpn: row.mpn,
    manufacturer: row.manufacturer,
    datasheetUrl: row.datasheetUrl,
    source: row.source,
  };
}

export async function upsertCatalogDatasheet(input: {
  mpn: string;
  manufacturer?: string | null;
  datasheetUrl: string;
  source: DatasheetSource;
  verified?: boolean;
}): Promise<DatasheetCatalogEntry | null> {
  const normalizedUrl = normalizeDatasheetUrl(input.datasheetUrl);
  if (!normalizedUrl) {
    return null;
  }

  const mpnNormalized = normalizeMpn(input.mpn);
  if (!mpnNormalized) {
    return null;
  }

  const row = await db.partDatasheet.upsert({
    where: { mpnNormalized },
    create: {
      mpnNormalized,
      mpn: input.mpn.trim(),
      manufacturer: input.manufacturer?.trim() || null,
      datasheetUrl: normalizedUrl,
      source: input.source,
      verifiedAt: input.verified ? new Date() : null,
    },
    update: {
      mpn: input.mpn.trim(),
      manufacturer: input.manufacturer?.trim() || null,
      datasheetUrl: normalizedUrl,
      source: input.source,
      verifiedAt: input.verified ? new Date() : undefined,
    },
  });

  return {
    mpnNormalized: row.mpnNormalized,
    mpn: row.mpn,
    manufacturer: row.manufacturer,
    datasheetUrl: row.datasheetUrl,
    source: row.source,
  };
}

export async function getListingDatasheetUrls(mpnNormalized: string): Promise<string[]> {
  const listings = await db.partListing.findMany({
    where: {
      isActive: true,
      mpnNormalized,
      datasheetUrl: { not: null },
    },
    select: { datasheetUrl: true },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return collectUniqueUrls(listings);
}

export function mergeDatasheetUrls(
  catalogUrl: string | null,
  listingUrls: string[],
): string[] {
  const urls = new Set<string>();

  if (catalogUrl) {
    urls.add(catalogUrl);
  }

  for (const url of listingUrls) {
    urls.add(url);
  }

  return [...urls];
}

export function collectUniqueUrls(
  sources: Array<{ datasheetUrl: string | null }>,
): string[] {
  const urls = new Set<string>();

  for (const source of sources) {
    const normalized = normalizeDatasheetUrl(source.datasheetUrl);
    if (normalized) {
      urls.add(normalized);
    }
  }

  return [...urls];
}

export async function getDatasheetSourcesForMpn(input: {
  mpn: string;
  mpnNormalized: string;
}): Promise<string[]> {
  const [catalog, listingUrls] = await Promise.all([
    getCatalogDatasheet(input.mpnNormalized),
    getListingDatasheetUrls(input.mpnNormalized),
  ]);

  return mergeDatasheetUrls(catalog?.datasheetUrl ?? null, listingUrls);
}

export async function getPrimaryManufacturerForMpn(
  mpnNormalized: string,
): Promise<string | null> {
  const listing = await db.partListing.findFirst({
    where: { isActive: true, mpnNormalized },
    select: { manufacturer: true },
    orderBy: { updatedAt: "desc" },
  });

  return listing?.manufacturer?.trim() || null;
}
