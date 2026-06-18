/** Strip separators and uppercase so STM32F407-VGT6 matches STM32F407VGT6. */
export function normalizeMpn(mpn: string): string {
  return mpn.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
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
