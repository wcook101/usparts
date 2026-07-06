import type { DatasheetSource } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  collectUniqueUrls,
  getCatalogDatasheet,
  getListingDatasheetUrls,
  mergeDatasheetUrls,
  upsertCatalogDatasheet,
} from "@/lib/datasheet-catalog";
import { resolveManufacturerDatasheetUrl } from "@/lib/datasheet-manufacturers";
import { isNexarConfigured, resolveNexarDatasheetUrl } from "@/lib/datasheet-nexar";
import { normalizeMpn } from "@/lib/mpn-normalize";

const inFlightResolves = new Map<string, Promise<ResolveDatasheetResult>>();

export type ResolveDatasheetResult = {
  mpnNormalized: string;
  mpn: string;
  manufacturer: string | null;
  datasheetUrls: string[];
  source: DatasheetSource | null;
  resolved: boolean;
};

async function resolveMissingDatasheet(input: {
  mpn: string;
  mpnNormalized: string;
  manufacturer: string | null;
  listingUrls: string[];
}): Promise<ResolveDatasheetResult> {
  const existingCatalog = await getCatalogDatasheet(input.mpnNormalized);
  if (existingCatalog) {
    return {
      mpnNormalized: input.mpnNormalized,
      mpn: input.mpn,
      manufacturer: input.manufacturer,
      datasheetUrls: mergeDatasheetUrls(
        existingCatalog.datasheetUrl,
        input.listingUrls,
      ),
      source: existingCatalog.source,
      resolved: false,
    };
  }

  if (input.listingUrls.length > 0) {
    const primaryUrl = input.listingUrls[0]!;
    await upsertCatalogDatasheet({
      mpn: input.mpn,
      manufacturer: input.manufacturer,
      datasheetUrl: primaryUrl,
      source: "LISTING",
      verified: true,
    });

    return {
      mpnNormalized: input.mpnNormalized,
      mpn: input.mpn,
      manufacturer: input.manufacturer,
      datasheetUrls: input.listingUrls,
      source: "LISTING",
      resolved: true,
    };
  }

  const manufacturerUrl = await resolveManufacturerDatasheetUrl(
    input.mpn,
    input.manufacturer,
  );

  if (manufacturerUrl) {
    await upsertCatalogDatasheet({
      mpn: input.mpn,
      manufacturer: input.manufacturer,
      datasheetUrl: manufacturerUrl,
      source: "MANUFACTURER",
      verified: true,
    });

    return {
      mpnNormalized: input.mpnNormalized,
      mpn: input.mpn,
      manufacturer: input.manufacturer,
      datasheetUrls: [manufacturerUrl],
      source: "MANUFACTURER",
      resolved: true,
    };
  }

  if (isNexarConfigured()) {
    const nexarUrl = await resolveNexarDatasheetUrl(input.mpn);
    if (nexarUrl) {
      await upsertCatalogDatasheet({
        mpn: input.mpn,
        manufacturer: input.manufacturer,
        datasheetUrl: nexarUrl,
        source: "NEXAR",
        verified: true,
      });

      return {
        mpnNormalized: input.mpnNormalized,
        mpn: input.mpn,
        manufacturer: input.manufacturer,
        datasheetUrls: [nexarUrl],
        source: "NEXAR",
        resolved: true,
      };
    }
  }

  return {
    mpnNormalized: input.mpnNormalized,
    mpn: input.mpn,
    manufacturer: input.manufacturer,
    datasheetUrls: [],
    source: null,
    resolved: false,
  };
}

export async function resolveDatasheetsForMpn(input: {
  mpn: string;
  manufacturer?: string | null;
}): Promise<ResolveDatasheetResult> {
  const mpnNormalized = normalizeMpn(input.mpn);
  if (!mpnNormalized) {
    return {
      mpnNormalized: "",
      mpn: input.mpn,
      manufacturer: input.manufacturer ?? null,
      datasheetUrls: [],
      source: null,
      resolved: false,
    };
  }

  const listingUrls = await getListingDatasheetUrls(mpnNormalized);
  const catalog = await getCatalogDatasheet(mpnNormalized);

  if (catalog || listingUrls.length > 0) {
    return {
      mpnNormalized,
      mpn: catalog?.mpn ?? input.mpn.trim(),
      manufacturer: catalog?.manufacturer ?? input.manufacturer ?? null,
      datasheetUrls: mergeDatasheetUrls(catalog?.datasheetUrl ?? null, listingUrls),
      source: catalog?.source ?? (listingUrls.length > 0 ? "LISTING" : null),
      resolved: false,
    };
  }

  const existing = inFlightResolves.get(mpnNormalized);
  if (existing) {
    return existing;
  }

  const resolvePromise = resolveMissingDatasheet({
    mpn: input.mpn.trim(),
    mpnNormalized,
    manufacturer: input.manufacturer ?? null,
    listingUrls,
  });

  inFlightResolves.set(mpnNormalized, resolvePromise);

  try {
    return await resolvePromise;
  } finally {
    inFlightResolves.delete(mpnNormalized);
  }
}

export async function getAuthorizedDatasheetUrl(input: {
  mpnNormalized: string;
  index?: number;
}): Promise<{ url: string; mpn: string } | null> {
  const listingUrls = await getListingDatasheetUrls(input.mpnNormalized);
  const catalog = await getCatalogDatasheet(input.mpnNormalized);
  const urls = mergeDatasheetUrls(catalog?.datasheetUrl ?? null, listingUrls);
  const index = input.index ?? 0;
  const url = urls[index];

  if (!url) {
    return null;
  }

  return {
    url,
    mpn: catalog?.mpn ?? input.mpnNormalized,
  };
}

export async function backfillDatasheetsFromListings(): Promise<number> {
  const listings = await db.partListing.findMany({
    where: {
      isActive: true,
      datasheetUrl: { not: null },
    },
    select: {
      mpn: true,
      mpnNormalized: true,
      manufacturer: true,
      datasheetUrl: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const bestByMpn = new Map<
    string,
    { mpn: string; manufacturer: string; datasheetUrl: string }
  >();

  for (const listing of listings) {
    if (!bestByMpn.has(listing.mpnNormalized) && listing.datasheetUrl) {
      bestByMpn.set(listing.mpnNormalized, {
        mpn: listing.mpn,
        manufacturer: listing.manufacturer,
        datasheetUrl: listing.datasheetUrl,
      });
    }
  }

  let written = 0;
  for (const [mpnNormalized, row] of bestByMpn) {
    const existing = await getCatalogDatasheet(mpnNormalized);
    if (existing) {
      continue;
    }

    const saved = await upsertCatalogDatasheet({
      mpn: row.mpn,
      manufacturer: row.manufacturer,
      datasheetUrl: row.datasheetUrl,
      source: "LISTING",
      verified: true,
    });

    if (saved) {
      written += 1;
    }
  }

  return written;
}

export { collectUniqueUrls };
