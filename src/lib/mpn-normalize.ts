/** Strip separators and uppercase so STM32F407-VGT6 matches STM32F407VGT6. */
export function normalizeMpn(mpn: string): string {
  return mpn.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Whether a pasted query matches a catalog MPN (exact or family prefix). */
export function bulkQueryMatchesListing(
  queryNormalized: string,
  listingNormalized: string,
): boolean {
  if (!queryNormalized || !listingNormalized) {
    return false;
  }

  if (queryNormalized === listingNormalized) {
    return true;
  }

  const minPrefixLength = 3;

  if (
    queryNormalized.length >= minPrefixLength &&
    listingNormalized.startsWith(queryNormalized)
  ) {
    return true;
  }

  if (
    listingNormalized.length >= minPrefixLength &&
    queryNormalized.startsWith(listingNormalized)
  ) {
    return true;
  }

  return false;
}

/** Whether an inventory listing matches a curated family pattern (stricter than substring). */
export function listingMatchesInventoryPattern(
  listingNormalized: string,
  pattern: string,
): boolean {
  const listing = listingNormalized.toUpperCase();
  const fragment = pattern.toUpperCase();

  if (!listing || !fragment) {
    return false;
  }

  if (listing.startsWith(fragment)) {
    return true;
  }

  if (/^\d+$/.test(fragment)) {
    return new RegExp(`^[A-Z]{1,4}${fragment}(?:[A-Z0-9]|$)`).test(listing);
  }

  const index = listing.indexOf(fragment);
  if (index === -1) {
    return false;
  }

  if (index === 0) {
    return true;
  }

  // Allow a short non-numeric vendor prefix (e.g. R80286 for pattern 80286).
  if (index <= 3 && !/[0-9]/.test(listing.slice(0, index))) {
    return true;
  }

  return false;
}
export function buildQueryPrefixSet(normalizedQueries: string[], minLength = 3): string[] {
  const prefixes = new Set<string>();

  for (const query of normalizedQueries) {
    for (let length = minLength; length <= query.length; length += 1) {
      prefixes.add(query.slice(0, length));
    }
  }

  return [...prefixes];
}

export type ParsedMpnEntry = {
  input: string;
  normalized: string;
};

/** Parse pasted BOM lines, comma lists, or tab-separated part numbers. */
export function parseMpnList(input: string): ParsedMpnEntry[] {
  const seen = new Set<string>();
  const entries: ParsedMpnEntry[] = [];

  for (const chunk of input.split(/[\r\n,;\t]+/)) {
    const trimmedChunk = chunk.replace(/\r/g, "").trim();
    if (!trimmedChunk) {
      continue;
    }

    const tokens =
      trimmedChunk.includes(" ") &&
      trimmedChunk.split(/\s+/).every((token) => normalizeMpn(token).length >= 3)
        ? trimmedChunk.split(/\s+/).filter(Boolean)
        : [trimmedChunk];

    for (const raw of tokens) {
      const trimmed = raw.trim();
      if (!trimmed) {
        continue;
      }

      const normalized = normalizeMpn(trimmed);
      if (!normalized || seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      entries.push({ input: trimmed, normalized });
    }
  }

  return entries;
}

export function looksLikeMultiPartQuery(input: string): boolean {
  return parseMpnList(input).length > 1;
}

/** e.g. NE555H → { base: "NE555", suffix: "H" } — same die, different package suffix. */
export function parseSingleLetterPackageVariant(
  mpn: string,
): { base: string; suffix: string } | null {
  if (mpn.length < 4 || mpn.length > 10) {
    return null;
  }

  const suffix = mpn.at(-1);
  if (!suffix || !/[A-Z]/.test(suffix)) {
    return null;
  }

  const base = mpn.slice(0, -1);
  if (base.length < 3 || !/[0-9]/.test(base)) {
    return null;
  }

  return { base, suffix };
}

/** Whether two MPNs differ only by a single-letter package suffix on the same base. */
export function isSingleLetterPackageVariantSibling(
  queryNormalized: string,
  listingNormalized: string,
): boolean {
  if (!queryNormalized || !listingNormalized || queryNormalized === listingNormalized) {
    return false;
  }

  const queryVariant = parseSingleLetterPackageVariant(queryNormalized);
  const listingVariant = parseSingleLetterPackageVariant(listingNormalized);

  if (!queryVariant || !listingVariant) {
    return false;
  }

  return queryVariant.base === listingVariant.base;
}
