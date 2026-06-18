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

/** Prefixes of a query used to find shorter catalog MPNs (e.g. query ends with TR). */
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

  for (const raw of input.split(/[\n,;\t]+/)) {
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

  return entries;
}
