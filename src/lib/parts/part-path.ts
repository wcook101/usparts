export function getPartPagePath(mpn: string): string {
  return `/parts/${encodeURIComponent(mpn.trim())}`;
}
