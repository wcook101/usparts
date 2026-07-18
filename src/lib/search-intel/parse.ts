import { isMilSpecMpn } from "@/lib/datasheet-mpn-formats";
import { MANUFACTURER_PROFILES } from "@/lib/manufacturers/catalog";
import { normalizeMpn, parseMpnList } from "@/lib/mpn-normalize";

export type ParsedSearchTerms = {
  mpns: Array<{ input: string; normalized: string }>;
  manufacturers: string[];
  categories: string[];
  rawQuery: string | null;
};

function matchManufacturerKey(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  for (const profile of MANUFACTURER_PROFILES) {
    if (profile.name.toLowerCase() === lower) return profile.slug;
    if (profile.searchTerm.toLowerCase() === lower) return profile.slug;
    if (profile.exactAliases?.some((alias) => alias.toLowerCase() === lower)) {
      return profile.slug;
    }
    if (profile.aliases.some((alias) => alias.toLowerCase() === lower)) {
      return profile.slug;
    }
  }

  // Free-text manufacturer filter that isn't in the catalog yet.
  return `raw:${lower.slice(0, 120)}`;
}

function manufacturerLabel(key: string): string {
  if (key.startsWith("raw:")) {
    return key.slice(4);
  }
  const profile = MANUFACTURER_PROFILES.find((item) => item.slug === key);
  return profile?.name ?? key;
}

export function resolveManufacturerLabel(key: string) {
  return manufacturerLabel(key);
}

/** Parse SearchEvent.queryText + optional manufacturer/category columns. */
export function parseSearchTerms(input: {
  mode: "SINGLE" | "BULK" | "SMART";
  queryText: string;
  manufacturer?: string | null;
  category?: string | null;
}): ParsedSearchTerms {
  const manufacturers = new Set<string>();
  const categories = new Set<string>();
  const mpns: Array<{ input: string; normalized: string }> = [];
  const seenMpn = new Set<string>();

  const addMpn = (raw: string) => {
    const normalized = normalizeMpn(raw);
    if (!normalized || seenMpn.has(normalized)) return;
    // Ignore pure manufacturer-name tokens mistaken as MPNs when very short alpha.
    if (normalized.length < 3) return;
    seenMpn.add(normalized);
    mpns.push({ input: raw.trim(), normalized });
  };

  if (input.manufacturer?.trim()) {
    const key = matchManufacturerKey(input.manufacturer);
    if (key) manufacturers.add(key);
  }
  if (input.category?.trim()) {
    categories.add(input.category.trim().toUpperCase());
  }

  let rawQuery: string | null = null;

  if (input.mode === "BULK") {
    for (const entry of parseMpnList(input.queryText)) {
      addMpn(entry.input);
    }
    return {
      mpns,
      manufacturers: [...manufacturers],
      categories: [...categories],
      rawQuery: null,
    };
  }

  if (input.mode === "SMART") {
    rawQuery = input.queryText.trim() || null;
    // Best-effort: pull MPN-looking tokens from describe-a-part text.
    for (const entry of parseMpnList(input.queryText.replace(/\s+/g, "\n"))) {
      if (entry.normalized.length >= 4) addMpn(entry.input);
    }
    return {
      mpns,
      manufacturers: [...manufacturers],
      categories: [...categories],
      rawQuery,
    };
  }

  // SINGLE — parts joined with " · ", plus mfr:/cat: prefixes.
  const segments = input.queryText
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const segment of segments) {
    if (segment === "filter") continue;

    const mfrMatch = segment.match(/^mfr:(.+)$/i);
    if (mfrMatch?.[1]) {
      const key = matchManufacturerKey(mfrMatch[1]);
      if (key) manufacturers.add(key);
      continue;
    }

    const catMatch = segment.match(/^cat:(.+)$/i);
    if (catMatch?.[1]) {
      categories.add(catMatch[1].trim().toUpperCase());
      continue;
    }

    rawQuery = segment;

    // Manufacturer-only search typed in the main box (e.g. "Texas Instruments").
    const asMfr = matchManufacturerKey(segment);
    if (
      asMfr &&
      !asMfr.startsWith("raw:") &&
      !/[0-9]/.test(segment) &&
      segment.length > 2
    ) {
      manufacturers.add(asMfr);
      continue;
    }

    addMpn(segment);
  }

  return {
    mpns,
    manufacturers: [...manufacturers],
    categories: [...categories],
    rawQuery,
  };
}

export function isMilitaryPart(normalizedMpn: string) {
  return isMilSpecMpn(normalizedMpn);
}
