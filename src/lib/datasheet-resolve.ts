import type { DatasheetSource } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  collectUniqueUrls,
  getCanonicalListingMpn,
  getCatalogDatasheet,
  getListingDatasheetUrls,
  mergeDatasheetUrls,
  upsertCatalogDatasheet,
} from "@/lib/datasheet-catalog";
import { getDatasheetLookupMpns } from "@/lib/datasheet-mpn-formats";
import { resolveManufacturerDatasheetUrls } from "@/lib/datasheet-manufacturers";
import {
  isOpenAiDatasheetLookupEnabled,
  resolveOpenAiDatasheetUrl,
} from "@/lib/datasheet-openai";
import { isNexarConfigured, resolveNexarDatasheetUrls } from "@/lib/datasheet-nexar";
import { lookupAliasTargets } from "@/lib/part-aliases";
import { normalizeMpn } from "@/lib/mpn-normalize";

const inFlightResolves = new Map<string, Promise<ResolveDatasheetResult>>();

export type ResolveDatasheetResult = {
  mpnNormalized: string;
  mpn: string;
  manufacturer: string | null;
  datasheetUrls: string[];
  source: DatasheetSource | null;
  resolved: boolean;
  matchNote: string | null;
};

async function resolveFromAliasTargets(input: {
  mpn: string;
  mpnNormalized: string;
  manufacturer: string | null;
}): Promise<ResolveDatasheetResult | null> {
  const aliasMap = await lookupAliasTargets([input.mpnNormalized]);
  const targets = aliasMap.get(input.mpnNormalized) ?? [];

  for (const target of targets) {
    const targetNormalized = normalizeMpn(target.inventoryMpn);
    if (!targetNormalized) {
      continue;
    }

    const [catalog, listingUrls] = await Promise.all([
      getCatalogDatasheet(targetNormalized),
      getListingDatasheetUrls(targetNormalized),
    ]);

    const urls = mergeDatasheetUrls(catalog?.datasheetUrl ?? null, listingUrls);
    if (urls.length > 0) {
      await upsertCatalogDatasheet({
        mpn: input.mpn,
        manufacturer: input.manufacturer ?? target.manufacturer,
        datasheetUrl: urls[0]!,
        source: catalog?.source ?? "LISTING",
        verified: true,
      });

      return {
        mpnNormalized: input.mpnNormalized,
        mpn: input.mpn,
        manufacturer: input.manufacturer,
        datasheetUrls: urls,
        source: catalog?.source ?? "LISTING",
        resolved: true,
        matchNote: `Matched via part alias to ${target.inventoryMpn}.`,
      };
    }

    const lookupMpns = getDatasheetLookupMpns(target.inventoryMpn);
    const manufacturerUrl = await resolveManufacturerDatasheetUrls(
      lookupMpns,
      target.manufacturer ?? input.manufacturer,
    );

    if (manufacturerUrl) {
      await upsertCatalogDatasheet({
        mpn: input.mpn,
        manufacturer: input.manufacturer ?? target.manufacturer,
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
        matchNote: `Matched via part alias to ${target.inventoryMpn}.`,
      };
    }
  }

  return null;
}

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
      matchNote: null,
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
      matchNote: null,
    };
  }

  const aliasResult = await resolveFromAliasTargets(input);
  if (aliasResult) {
    return aliasResult;
  }

  const lookupMpns = getDatasheetLookupMpns(input.mpn);
  const manufacturerUrl = await resolveManufacturerDatasheetUrls(
    lookupMpns,
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
      matchNote: null,
    };
  }

  if (isNexarConfigured()) {
    const nexarUrl = await resolveNexarDatasheetUrls(lookupMpns);
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
        matchNote: null,
      };
    }
  }

  if (isOpenAiDatasheetLookupEnabled()) {
    for (const lookupMpn of lookupMpns) {
      const openAiMatch = await resolveOpenAiDatasheetUrl(
        lookupMpn,
        input.manufacturer,
      );

      if (openAiMatch) {
        await upsertCatalogDatasheet({
          mpn: input.mpn,
          manufacturer: input.manufacturer,
          datasheetUrl: openAiMatch.url,
          source: "MANUAL",
          verified: true,
        });

        return {
          mpnNormalized: input.mpnNormalized,
          mpn: input.mpn,
          manufacturer: input.manufacturer,
          datasheetUrls: [openAiMatch.url],
          source: "MANUAL",
          resolved: true,
          matchNote:
            openAiMatch.matchType === "family"
              ? openAiMatch.note ??
                "Showing the closest official manufacturer family datasheet for this military part number."
              : openAiMatch.note,
        };
      }
    }
  }

  return {
    mpnNormalized: input.mpnNormalized,
    mpn: input.mpn,
    manufacturer: input.manufacturer,
    datasheetUrls: [],
    source: null,
    resolved: false,
    matchNote: null,
  };
}

export async function resolveDatasheetsForMpn(input: {
  mpn: string;
  mpnNormalized: string;
  manufacturer?: string | null;
  force?: boolean;
}): Promise<ResolveDatasheetResult> {
  const mpnNormalized = input.mpnNormalized || normalizeMpn(input.mpn);
  if (!mpnNormalized) {
    return {
      mpnNormalized: "",
      mpn: input.mpn,
      manufacturer: input.manufacturer ?? null,
      datasheetUrls: [],
      source: null,
      resolved: false,
      matchNote: null,
    };
  }

  const listingUrls = await getListingDatasheetUrls(mpnNormalized);
  const catalog = await getCatalogDatasheet(mpnNormalized);

  if (!input.force && (catalog || listingUrls.length > 0)) {
    return {
      mpnNormalized,
      mpn: catalog?.mpn ?? input.mpn.trim(),
      manufacturer: catalog?.manufacturer ?? input.manufacturer ?? null,
      datasheetUrls: mergeDatasheetUrls(catalog?.datasheetUrl ?? null, listingUrls),
      source: catalog?.source ?? (listingUrls.length > 0 ? "LISTING" : null),
      resolved: false,
      matchNote: null,
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

export async function resolveDatasheetsForNormalizedMpn(
  mpnNormalized: string,
  options?: { force?: boolean },
): Promise<ResolveDatasheetResult> {
  const canonical = await getCanonicalListingMpn(mpnNormalized);
  const mpn = canonical?.mpn ?? mpnNormalized;

  return resolveDatasheetsForMpn({
    mpn,
    mpnNormalized,
    manufacturer: canonical?.manufacturer ?? null,
    force: options?.force,
  });
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
