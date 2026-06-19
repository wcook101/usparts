import type { BulkSearchInput } from "@/lib/validations";
import {
  type BulkSearchResult,
  type ListingWithCompany,
} from "@/lib/listings";
import { db } from "@/lib/db";
import { MAX_SEARCH_RESULTS } from "@/lib/listings";
import { normalizeMpn } from "@/lib/mpn-normalize";

type CategoryPattern = {
  pattern: RegExp;
  mpnContains: string[];
};

/** Broad part descriptions mapped to MPN substrings common in surplus inventory. */
const CATEGORY_MPN_PATTERNS: CategoryPattern[] = [
  {
    pattern: /\b(microprocessor|microprocessors|cpu|cpus|mpu|processor|processors)\b/i,
    mpnContains: [
      "80286",
      "80386",
      "80486",
      "80186",
      "8086",
      "8088",
      "68000",
      "68010",
      "68020",
      "68030",
      "68040",
      "Z80",
      "6502",
      "8080",
      "8085",
      "PENTIUM",
      "I386",
      "I486",
      "AM486",
      "K6",
      "R80186",
    ],
  },
  {
    pattern: /\b(mcu|microcontroller|microcontrollers)\b/i,
    mpnContains: [
      "ATMEGA",
      "ATTINY",
      "PIC16",
      "PIC18",
      "MSP430",
      "STM32",
      "EFM32",
      "LPC1",
      "C8051",
      "PIC24",
      "PIC32",
    ],
  },
  {
    pattern: /\b(fpga|cpld|programmable logic)\b/i,
    mpnContains: ["XC2", "XC3", "XC4", "XC5", "EPM", "EPF", "MAX7000", "MAX3000"],
  },
  {
    pattern: /\b(dsp|digital signal processor)\b/i,
    mpnContains: ["TMS320", "ADSP", "DSP56", "DSP48"],
  },
  {
    pattern: /\b(op\s*amp|opamp|operational amplifier)\b/i,
    mpnContains: ["LM358", "LM324", "TL074", "OP07", "OPA", "NE5532", "AD86"],
  },
];

export function getInventoryFallbackPatterns(query: string): string[] {
  const normalized = query.trim();
  if (!normalized) {
    return [];
  }

  const patterns = new Set<string>();

  for (const category of CATEGORY_MPN_PATTERNS) {
    if (!category.pattern.test(normalized)) {
      continue;
    }

    for (const fragment of category.mpnContains) {
      patterns.add(fragment);
    }
  }

  return [...patterns];
}

export async function searchListingsByMpnPatterns(
  patterns: string[],
  input: Pick<BulkSearchInput, "manufacturer" | "category">,
): Promise<ListingWithCompany[]> {
  const validPatterns = [...new Set(patterns.map((pattern) => pattern.trim().toUpperCase()))].filter(
    (pattern) => pattern.length >= 4,
  );

  if (validPatterns.length === 0) {
    return [];
  }

  const category = input.category?.trim();
  const manufacturer = input.manufacturer?.trim();

  return db.partListing.findMany({
    where: {
      isActive: true,
      OR: validPatterns.map((pattern) => ({
        mpnNormalized: { contains: pattern },
      })),
      ...(category ? { category: category as never } : {}),
      ...(manufacturer
        ? { manufacturer: { contains: manufacturer, mode: "insensitive" } }
        : {}),
    },
    include: { company: true, inventoryLocation: true },
    orderBy: [{ mpnNormalized: "asc" }, { quantity: "desc" }, { updatedAt: "desc" }],
    take: MAX_SEARCH_RESULTS,
  });
}

function buildBulkSearchFromListings(
  listings: ListingWithCompany[],
  startedAt: number,
): BulkSearchResult {
  const grouped = new Map<string, ListingWithCompany[]>();

  for (const listing of listings) {
    const existing = grouped.get(listing.mpnNormalized);
    if (existing) {
      existing.push(listing);
    } else {
      grouped.set(listing.mpnNormalized, [listing]);
    }
  }

  const rows = [...grouped.entries()].map(([normalizedMpn, matched]) => ({
    input: matched[0]?.mpn ?? normalizedMpn,
    normalizedMpn,
    found: true,
    matchType: "EXACT" as const,
    listings: matched,
  }));

  return {
    rows,
    queriedCount: rows.length,
    foundPartCount: rows.length,
    notFoundPartCount: 0,
    totalListingCount: listings.length,
    durationMs: Date.now() - startedAt,
  };
}

export async function applyInventoryFallback(
  query: string,
  search: BulkSearchResult,
  input: Pick<BulkSearchInput, "manufacturer" | "category">,
): Promise<{ search: BulkSearchResult; usedInventoryFallback: boolean }> {
  if (search.totalListingCount > 0) {
    return { search, usedInventoryFallback: false };
  }

  const patterns = getInventoryFallbackPatterns(query);
  if (patterns.length === 0) {
    return { search, usedInventoryFallback: false };
  }

  const startedAt = Date.now();
  const listings = await searchListingsByMpnPatterns(patterns, input);

  if (listings.length === 0) {
    return { search, usedInventoryFallback: false };
  }

  return {
    search: buildBulkSearchFromListings(listings, startedAt),
    usedInventoryFallback: true,
  };
}

function extractConservativeNumericCores(mpns: string): string[] {
  const cores = new Set<string>();
  const legacyCorePattern =
    /^(8086|8088|8080|8085|80186|80286|80386|80486|68000|68010|68020|68030|68040|6502|Z80)$/i;

  for (const chunk of mpns.split(/[\r\n,;\t]+/)) {
    const normalized = normalizeMpn(chunk);
    if (!normalized) {
      continue;
    }

    const matches = normalized.match(/\d{4,}/g);
    if (!matches) {
      continue;
    }

    for (const match of matches) {
      if (match.length >= 5 || legacyCorePattern.test(match)) {
        cores.add(match);
      }
    }
  }

  return [...cores];
}

/** Search inventory for classic numeric cores embedded in AI suggestions (e.g. 8086 in D8086). */
export async function searchByEmbeddedNumericCores(
  input: BulkSearchInput,
): Promise<BulkSearchResult | null> {
  const cores = extractConservativeNumericCores(input.mpns);
  if (cores.length === 0) {
    return null;
  }

  const startedAt = Date.now();
  const listings = await searchListingsByMpnPatterns(cores, input);

  if (listings.length === 0) {
    return null;
  }

  return buildBulkSearchFromListings(listings, startedAt);
}
