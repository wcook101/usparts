import { normalizeMpn } from "@/lib/mpn-normalize";

/** Reconstruct common US military SMD formats from normalized catalog MPNs. */
export function formatMilSpecMpn(normalized: string): string | null {
  const value = normalized.trim().toUpperCase();
  if (!value) {
    return null;
  }

  const smd5962 = value.match(/^5962(\d{7})([A-Z0-9]{1,4})$/);
  if (smd5962) {
    return `5962-${smd5962[1]}${smd5962[2]}`;
  }

  const jm38510 = value.match(/^(JM38510[/]?)([A-Z0-9]+)$/);
  if (jm38510) {
    return `${jm38510[1]}${jm38510[2]}`;
  }

  return null;
}

export function getDatasheetLookupMpns(mpn: string): string[] {
  const trimmed = mpn.trim();
  const normalized = normalizeMpn(trimmed);
  const formattedMilSpec = normalized ? formatMilSpecMpn(normalized) : null;

  const variants = new Set<string>();

  if (trimmed) {
    variants.add(trimmed);
  }

  if (formattedMilSpec) {
    variants.add(formattedMilSpec);
  }

  if (normalized) {
    variants.add(normalized);
  }

  if (formattedMilSpec) {
    variants.add(normalizeMpn(formattedMilSpec));
  }

  return [...variants];
}

export function isMilSpecMpn(mpn: string): boolean {
  const normalized = normalizeMpn(mpn);
  if (!normalized) {
    return false;
  }

  return (
    normalized.startsWith("5962") ||
    normalized.startsWith("JM38510") ||
    normalized.startsWith("883")
  );
}
