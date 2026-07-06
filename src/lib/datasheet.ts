import { normalizeWebsiteUrl } from "@/lib/format";

type DatasheetSource = {
  datasheetUrl?: string | null;
};

export function normalizeDatasheetUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = normalizeWebsiteUrl(trimmed);
  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function collectDatasheetUrls(sources: DatasheetSource[]): string[] {
  const urls = new Set<string>();

  for (const source of sources) {
    const normalized = normalizeDatasheetUrl(source.datasheetUrl);
    if (normalized) {
      urls.add(normalized);
    }
  }

  return [...urls];
}

export function isLikelyPdfUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith(".pdf") || pathname.includes(".pdf");
  } catch {
    return url.toLowerCase().includes(".pdf");
  }
}

export function datasheetViewPath(mpnNormalized: string, index = 0): string {
  const params = index > 0 ? `?index=${index}` : "";
  return `/api/datasheets/${encodeURIComponent(mpnNormalized)}/view${params}`;
}

export function datasheetDownloadPath(mpnNormalized: string, index = 0): string {
  const params = index > 0 ? `?index=${index}` : "";
  return `/api/datasheets/${encodeURIComponent(mpnNormalized)}/download${params}`;
}

export function datasheetResolvePath(mpnNormalized: string): string {
  return `/api/datasheets/${encodeURIComponent(mpnNormalized)}/resolve`;
}
