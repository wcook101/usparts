import type { BulkSearchInput } from "@/lib/validations";
import {
  type BulkSearchResult,
  type ListingWithCompany,
} from "@/lib/listings";
import { db } from "@/lib/db";
import { listingMatchesInventoryPattern } from "@/lib/mpn-normalize";

export const SMART_SEARCH_FALLBACK_LIMIT = 250;

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
    pattern:
      /\b(connector|connectors|header|headers|wire\s*to\s*board|wiring\s*connector)\b/i,
    mpnContains: [
      "0878",
      "2201",
      "2202",
      "2203",
      "5057",
      "5304",
      "43025",
      "47035",
      "MTA100",
      "MTA156",
      "MTA203",
      "5015",
      "50-57",
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

  const candidates = await db.partListing.findMany({
    where: {
      isActive: true,
      OR: validPatterns.flatMap((pattern) => {
        if (/^\d+$/.test(pattern)) {
          return [
            { mpnNormalized: { startsWith: pattern } },
            { mpnNormalized: { startsWith: `R${pattern}` } },
            { mpnNormalized: { startsWith: `D${pattern}` } },
            { mpnNormalized: { startsWith: `P${pattern}` } },
            { mpnNormalized: { startsWith: `SAB${pattern}` } },
          ];
        }

        return [
          { mpnNormalized: { startsWith: pattern } },
          { mpnNormalized: { contains: pattern } },
        ];
      }),
      ...(category ? { category: category as never } : {}),
      ...(manufacturer
        ? { manufacturer: { contains: manufacturer, mode: "insensitive" } }
        : {}),
    },
    include: { company: true, inventoryLocation: true },
    orderBy: [{ quantity: "desc" }, { mpnNormalized: "asc" }, { updatedAt: "desc" }],
    take: SMART_SEARCH_FALLBACK_LIMIT * 3,
  });

  return candidates
    .filter((listing) =>
      validPatterns.some((pattern) =>
        listingMatchesInventoryPattern(listing.mpnNormalized, pattern),
      ),
    )
    .slice(0, SMART_SEARCH_FALLBACK_LIMIT);
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

/** Drop smart-search rows whose listings do not plausibly match the AI suggestion. */
export function filterSmartSearchBulkResult(
  search: BulkSearchResult,
  suggestedMpns: string[],
): BulkSearchResult {
  const suggestions = suggestedMpns
    .map((mpn) => mpn.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .filter(Boolean);

  if (suggestions.length === 0) {
    return search;
  }

  const startedAt = Date.now();
  const rows = search.rows
    .map((row) => {
      const listings = row.listings.filter((listing) =>
        suggestions.some((suggestion) =>
          listingMatchesSuggestion(suggestion, listing.mpnNormalized),
        ),
      );

      return {
        ...row,
        found: listings.length > 0,
        listings,
      };
    })
    .filter((row) => row.found);

  const totalListingCount = rows.reduce((sum, row) => sum + row.listings.length, 0);

  return {
    rows,
    queriedCount: search.queriedCount,
    foundPartCount: rows.length,
    notFoundPartCount: search.queriedCount - rows.length,
    totalListingCount,
    durationMs: Date.now() - startedAt,
  };
}

function listingMatchesSuggestion(
  suggestion: string,
  listingNormalized: string,
): boolean {
  if (!suggestion || !listingNormalized) {
    return false;
  }

  if (listingNormalized === suggestion) {
    return true;
  }

  if (
    suggestion.length >= 3 &&
    (listingNormalized.startsWith(suggestion) || suggestion.startsWith(listingNormalized))
  ) {
    return true;
  }

  // Numeric tails from Molex-style numbers (e.g. 0878321006 for suggestion 0878321006).
  if (/^\d{5,}$/.test(suggestion) && listingNormalized.includes(suggestion)) {
    return listingNormalized.startsWith(suggestion);
  }

  return false;
}
