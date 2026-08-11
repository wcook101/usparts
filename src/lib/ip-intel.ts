import { promises as dns } from "node:dns";
import { db } from "@/lib/db";

/**
 * Per-IP network + location enrichment for search analytics.
 *
 * Every lookup is cached in IpIntel, so a given IP costs one enrichment ever.
 * Sources, cheapest first:
 *  1. Reverse DNS (PTR)            — no key. Best "which company is this" signal.
 *  2. Team Cymru IP-to-ASN via DNS — no key. ASN, AS name, registry country.
 *  3. ipwho.is                     — no key, commercial use allowed, adds city.
 *  4. IPinfo Lite                  — needs IPINFO_TOKEN, unlimited, most accurate country.
 *
 * Enrichment never blocks a public search request and never throws: analytics
 * degrades to plain IPs rather than failing the page.
 */

export type IpIntelView = {
  ip: string;
  countryCode: string | null;
  countryName: string | null;
  continent: string | null;
  region: string | null;
  city: string | null;
  asn: number | null;
  asnName: string | null;
  asnDomain: string | null;
  hostname: string | null;
  orgName: string | null;
  orgDomain: string | null;
  isHosting: boolean;
  source: string | null;
};

type EnrichOptions = {
  /** Hard cap on provider lookups for this call. */
  maxLookups?: number;
  /** Stop starting new lookups after this many ms. */
  deadlineMs?: number;
};

const CACHE_TTL_MS = 45 * 24 * 60 * 60 * 1000;
const FAILURE_RETRY_MS = 6 * 60 * 60 * 1000;
const HTTP_TIMEOUT_MS = 2500;
const DNS_TIMEOUT_MS = 2000;
const LOOKUP_CONCURRENCY = 8;
const DEFAULT_MAX_LOOKUPS = 40;
const DEFAULT_DEADLINE_MS = 6000;
const IN_CHUNK_SIZE = 1000;

function isEnabled() {
  return process.env.IP_INTEL_ENABLED?.trim().toLowerCase() !== "false";
}

function ipinfoToken() {
  return process.env.IPINFO_TOKEN?.trim() || null;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const settled = work.catch(() => null);
  try {
    return await Promise.race([
      settled,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* IP parsing                                                          */
/* ------------------------------------------------------------------ */

function ipv4Octets(value: string): number[] | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;

  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    octets.push(n);
  }

  return octets;
}

/** Trim proxy artifacts (brackets, ports, zones, v4-mapped prefixes). */
export function normalizeIpForIntel(
  value: string | null | undefined,
): string | null {
  let ip = value?.trim().toLowerCase();
  if (!ip || ip === "unknown") return null;

  if (ip.startsWith("[")) {
    const end = ip.indexOf("]");
    ip = end > 0 ? ip.slice(1, end) : ip.slice(1);
  }

  const zone = ip.indexOf("%");
  if (zone > 0) ip = ip.slice(0, zone);

  if (ip.startsWith("::ffff:") && ipv4Octets(ip.slice(7))) {
    ip = ip.slice(7);
  }

  // "1.2.3.4:5678" from proxies that append the source port.
  const colonParts = ip.split(":");
  if (colonParts.length === 2 && colonParts[0] && ipv4Octets(colonParts[0])) {
    ip = colonParts[0];
  }

  if (ipv4Octets(ip)) return ip;
  if (/^[0-9a-f:]+$/.test(ip) && ip.includes(":")) return ip;

  return null;
}

/** Routable on the public internet, so a geo/ASN answer is possible. */
export function isPublicIp(ip: string): boolean {
  const octets = ipv4Octets(ip);
  if (octets) {
    const [a, b] = octets as [number, number, number, number];
    if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    // Carrier-grade NAT: no meaningful geo or org.
    if (a === 100 && b >= 64 && b <= 127) return false;
    return true;
  }

  if (!ip.includes(":")) return false;
  if (ip === "::" || ip === "::1") return false;
  if (/^f[cd]/.test(ip)) return false;
  if (/^fe[89ab]/.test(ip)) return false;
  return true;
}

function expandIpv6(ip: string): string | null {
  if (!ip.includes(":")) return null;

  const [head, tail, ...rest] = ip.split("::");
  if (rest.length > 0) return null;

  const headGroups = head ? head.split(":").filter(Boolean) : [];
  const tailGroups =
    tail === undefined ? [] : tail ? tail.split(":").filter(Boolean) : [];

  let groups: string[];
  if (tail === undefined) {
    groups = headGroups;
  } else {
    const fill = 8 - headGroups.length - tailGroups.length;
    if (fill < 0) return null;
    groups = [...headGroups, ...Array<string>(fill).fill("0"), ...tailGroups];
  }

  if (groups.length !== 8) return null;

  let nibbles = "";
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
    nibbles += group.padStart(4, "0");
  }

  return nibbles;
}

/* ------------------------------------------------------------------ */
/* Sources                                                             */
/* ------------------------------------------------------------------ */

async function reverseDns(ip: string): Promise<string | null> {
  const hostnames = await withTimeout(dns.reverse(ip), DNS_TIMEOUT_MS);
  const hostname = hostnames?.[0]?.trim().toLowerCase();
  return hostname ? hostname.replace(/\.$/, "").slice(0, 253) : null;
}

async function resolveTxt(name: string): Promise<string[]> {
  const records = await withTimeout(dns.resolveTxt(name), DNS_TIMEOUT_MS);
  return (records ?? []).map((parts) => parts.join(""));
}

const asNameCache = new Map<number, string | null>();

async function cymruAsName(asn: number): Promise<string | null> {
  const cached = asNameCache.get(asn);
  if (cached !== undefined) return cached;

  const [record] = await resolveTxt(`AS${asn}.asn.cymru.com`);
  // "7303 | AR | lacnic | 2000-06-09 | AS7303 - Telecom Argentina S.A., AR"
  const raw = record?.split("|")[4]?.trim().replace(/,\s*[A-Z]{2}$/, "") ?? null;
  // Drop the registry handle prefix: "BHN-33363 - Charter Communications, Inc".
  const value = raw?.replace(/^[A-Z0-9][A-Z0-9-]*\s+-\s+/, "").trim() || null;
  asNameCache.set(asn, value);
  return value;
}

type CymruResult = {
  asn: number | null;
  asnName: string | null;
  countryCode: string | null;
  registry: string | null;
};

async function lookupCymru(ip: string): Promise<CymruResult | null> {
  const octets = ipv4Octets(ip);
  let query: string;

  if (octets) {
    query = `${[...octets].reverse().join(".")}.origin.asn.cymru.com`;
  } else {
    const nibbles = expandIpv6(ip);
    if (!nibbles) return null;
    query = `${nibbles.split("").reverse().join(".")}.origin6.asn.cymru.com`;
  }

  const [record] = await resolveTxt(query);
  if (!record) return null;

  // "13335 | 1.1.1.0/24 | AU | apnic | 2011-08-11"
  const fields = record.split("|").map((field) => field.trim());
  const asnRaw = fields[0]?.split(/\s+/)[0];
  const asn = asnRaw && /^\d+$/.test(asnRaw) ? Number(asnRaw) : null;
  const countryCode = /^[A-Za-z]{2}$/.test(fields[2] ?? "")
    ? fields[2]!.toUpperCase()
    : null;

  return {
    asn,
    asnName: asn ? await cymruAsName(asn) : null,
    countryCode,
    registry: fields[3] || null,
  };
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 200) : null;
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

type GeoResult = {
  countryCode: string | null;
  countryName: string | null;
  continent: string | null;
  region: string | null;
  city: string | null;
  asn: number | null;
  asnName: string | null;
  asnDomain: string | null;
  orgName: string | null;
  isHosting: boolean | null;
  source: string;
};

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/** Free tier: 1,000/day per server IP, commercial use allowed, city included. */
async function lookupIpwhois(ip: string): Promise<GeoResult | null> {
  const payload = readRecord(
    await fetchJson(`https://ipwho.is/${encodeURIComponent(ip)}`),
  );
  if (payload.success !== true) return null;

  const connection = readRecord(payload.connection);
  const security = readRecord(payload.security);
  const asnRaw = connection.asn;

  return {
    countryCode: readString(payload.country_code)?.toUpperCase() ?? null,
    countryName: readString(payload.country),
    continent: readString(payload.continent),
    region: readString(payload.region),
    city: readString(payload.city),
    asn: typeof asnRaw === "number" && asnRaw > 0 ? asnRaw : null,
    asnName: readString(connection.org) ?? readString(connection.isp),
    asnDomain: readString(connection.domain)?.toLowerCase() ?? null,
    orgName: readString(connection.isp) ?? readString(connection.org),
    isHosting: typeof security.hosting === "boolean" ? security.hosting : null,
    source: "ipwho.is",
  };
}

/** Unlimited country + ASN. Requires a free IPINFO_TOKEN; attribution required. */
async function lookupIpinfoLite(
  ip: string,
  token: string,
): Promise<GeoResult | null> {
  const payload = readRecord(
    await fetchJson(
      `https://api.ipinfo.io/lite/${encodeURIComponent(ip)}?token=${encodeURIComponent(token)}`,
    ),
  );

  const countryCode = readString(payload.country_code)?.toUpperCase() ?? null;
  if (!countryCode) return null;

  const asnRaw = readString(payload.asn)?.replace(/^as/i, "");

  return {
    countryCode,
    countryName: readString(payload.country),
    continent: readString(payload.continent),
    region: null,
    city: null,
    asn: asnRaw && /^\d+$/.test(asnRaw) ? Number(asnRaw) : null,
    asnName: readString(payload.as_name),
    asnDomain: readString(payload.as_domain)?.toLowerCase() ?? null,
    orgName: readString(payload.as_name),
    isHosting: null,
    source: "ipinfo-lite",
  };
}

/* ------------------------------------------------------------------ */
/* Derivation                                                          */
/* ------------------------------------------------------------------ */

const MULTI_LABEL_SUFFIXES = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "com.au",
  "net.au",
  "com.br",
  "com.ar",
  "com.mx",
  "com.co",
  "com.tr",
  "com.cn",
  "com.tw",
  "com.hk",
  "com.sg",
  "com.my",
  "co.jp",
  "or.jp",
  "co.kr",
  "co.in",
  "co.za",
  "co.nz",
  "com.pe",
  "com.ec",
  "com.uy",
  "com.ve",
  "com.pl",
  "com.ua",
  "com.sa",
  "com.eg",
  "com.ph",
  "com.vn",
  "co.il",
  "com.pk",
  "com.bd",
  "com.ng",
]);

/** Registrable domain of a hostname ("mail.corp.intel.com" -> "intel.com"). */
export function registrableDomain(
  hostname: string | null | undefined,
): string | null {
  const host = hostname?.trim().toLowerCase().replace(/\.$/, "");
  if (!host || ipv4Octets(host) || host.includes(":")) return null;

  const labels = host.split(".").filter(Boolean);
  if (labels.length < 2) return null;

  const lastTwo = labels.slice(-2).join(".");
  if (MULTI_LABEL_SUFFIXES.has(lastTwo) && labels.length >= 3) {
    return labels.slice(-3).join(".");
  }

  return lastTwo;
}

/** Reverse-DNS names that describe an access network, not the visitor's employer. */
const ACCESS_NETWORK_HINT_RE =
  /(^|[^a-z])(dsl|adsl|vdsl|dyn|dynamic|dhcp|pool|ppp|pppoe|cpe|cable|catv|fibra|fiber|ftth|broadband|bband|wireless|wifi|wimax|lte|umts|gprs|mobile|cellular|subscriber|customer|client|user|host|hosts|ip|ips|static|fixed|res|resnet|retail|nat|cgn|cgnat|rev|reverse|unknown|no-reverse|noreverse)([^a-z]|$)/i;

const HOSTING_HINT_RE =
  /\b(amazon|aws|ec2|google\s?cloud|googleusercontent|gcp|microsoft|azure|digitalocean|linode|akamai|fastly|cloudflare|ovh|hetzner|vultr|scaleway|leaseweb|contabo|choopa|m247|datacamp|oracle\s?cloud|alibaba|aliyun|tencent|huawei\s?cloud|hostinger|godaddy|namecheap|ionos|rackspace|equinix|colo|datacenter|data\s?center|hosting|server|vps|cdn)\b/i;

/**
 * The company behind an IP, when the reverse DNS names one. Access networks
 * (Comcast, Telecom Argentina, cloud ranges) describe the pipe, not the visitor.
 */
export function guessCompanyDomain(
  intel: Pick<IpIntelView, "hostname" | "asnDomain" | "isHosting">,
): string | null {
  const domain = registrableDomain(intel.hostname);
  if (!domain) return null;
  if (intel.asnDomain && domain === intel.asnDomain) return null;

  const labels = intel.hostname?.split(".") ?? [];
  const localPart = labels.slice(0, Math.max(0, labels.length - 2)).join(".");
  if (ACCESS_NETWORK_HINT_RE.test(localPart)) return null;
  // "1-2-3-4.example.net" style PTRs encode the IP, so they are generic.
  if (/\d{1,3}[-.]\d{1,3}[-.]\d{1,3}/.test(localPart)) return null;

  return domain;
}

let regionNames: Intl.DisplayNames | null | undefined;

function countryNameFromCode(code: string | null): string | null {
  if (!code) return null;
  if (regionNames === undefined) {
    try {
      regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      regionNames = null;
    }
  }

  try {
    return regionNames?.of(code) ?? null;
  } catch {
    return null;
  }
}

/** Regional-indicator flag for a two-letter country code. */
export function countryFlagEmoji(code: string | null | undefined): string | null {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return null;
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((char) => 0x1f1a5 + char.charCodeAt(0)),
  );
}

/** "Buenos Aires, Argentina" — as specific as the cached data allows. */
export function formatIpLocation(
  intel: Pick<IpIntelView, "city" | "region" | "countryName" | "countryCode">,
): string | null {
  const country = intel.countryName ?? countryNameFromCode(intel.countryCode);
  const place = intel.city ?? intel.region;
  if (place && country) return `${place}, ${country}`;
  return place ?? country ?? null;
}

function isHostingLike(intel: {
  isHosting: boolean | null;
  asnName: string | null;
  orgName: string | null;
  hostname: string | null;
}) {
  if (typeof intel.isHosting === "boolean") return intel.isHosting;
  const haystack = [intel.asnName, intel.orgName, intel.hostname]
    .filter(Boolean)
    .join(" ");
  return haystack ? HOSTING_HINT_RE.test(haystack) : false;
}

async function enrichIp(ip: string): Promise<IpIntelView> {
  const token = ipinfoToken();

  const [hostname, cymru, ipwhois] = await Promise.all([
    reverseDns(ip),
    lookupCymru(ip),
    lookupIpwhois(ip),
  ]);

  // Only spend the token when the keyless provider came back empty.
  const geo =
    ipwhois ?? (token ? await lookupIpinfoLite(ip, token) : null) ?? null;

  const countryCode = geo?.countryCode ?? cymru?.countryCode ?? null;
  const asnName = geo?.asnName ?? cymru?.asnName ?? null;
  const sources = [
    hostname ? "rdns" : null,
    cymru ? "cymru" : null,
    geo?.source ?? null,
  ].filter(Boolean);

  const base = {
    ip,
    countryCode,
    countryName: geo?.countryName ?? countryNameFromCode(countryCode),
    continent: geo?.continent ?? null,
    region: geo?.region ?? null,
    city: geo?.city ?? null,
    asn: geo?.asn ?? cymru?.asn ?? null,
    asnName,
    asnDomain: geo?.asnDomain ?? null,
    hostname,
    orgName: geo?.orgName ?? asnName,
    orgDomain: geo?.asnDomain ?? registrableDomain(hostname),
    source: sources.length > 0 ? sources.join("+") : null,
  };

  return {
    ...base,
    isHosting: isHostingLike({
      isHosting: geo?.isHosting ?? null,
      asnName: base.asnName,
      orgName: base.orgName,
      hostname,
    }),
  };
}

/* ------------------------------------------------------------------ */
/* Cache access                                                        */
/* ------------------------------------------------------------------ */

type CacheRow = IpIntelView & {
  registry: string | null;
  lookupError: string | null;
  attempts: number;
  checkedAt: Date;
};

async function readCache(ips: string[]): Promise<Map<string, CacheRow>> {
  const cached = new Map<string, CacheRow>();

  for (const batch of chunk(ips, IN_CHUNK_SIZE)) {
    const rows = await db.ipIntel.findMany({ where: { ip: { in: batch } } });
    for (const row of rows) {
      cached.set(row.ip, row as CacheRow);
    }
  }

  return cached;
}

function isFresh(row: CacheRow, now: number) {
  const age = now - row.checkedAt.getTime();
  if (row.lookupError) return age < FAILURE_RETRY_MS;
  return age < CACHE_TTL_MS;
}

async function persist(intel: IpIntelView, attempts: number) {
  const failed = !intel.countryCode && !intel.asn && !intel.hostname;
  const data = {
    countryCode: intel.countryCode,
    countryName: intel.countryName,
    continent: intel.continent,
    region: intel.region,
    city: intel.city,
    asn: intel.asn,
    asnName: intel.asnName,
    asnDomain: intel.asnDomain,
    hostname: intel.hostname,
    orgName: intel.orgName,
    orgDomain: intel.orgDomain,
    isHosting: intel.isHosting,
    source: intel.source,
    lookupError: failed ? "no provider returned data" : null,
    attempts,
    checkedAt: new Date(),
  };

  await db.ipIntel.upsert({
    where: { ip: intel.ip },
    create: { ip: intel.ip, ...data },
    update: data,
  });
}

async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      if (item === undefined) return;
      await worker(item);
    }
  });

  await Promise.all(runners);
}

/**
 * Network + location for each supplied IP, keyed by the exact string passed in.
 * Cached IPs are free; up to `maxLookups` uncached IPs are enriched inline
 * within `deadlineMs`, and anything left over resolves on a later call or cron.
 */
export async function getIpIntelMap(
  rawIps: Array<string | null | undefined>,
  options: EnrichOptions = {},
): Promise<Map<string, IpIntelView>> {
  const result = new Map<string, IpIntelView>();

  const normalizedByRaw = new Map<string, string>();
  const candidates = new Set<string>();
  for (const raw of rawIps) {
    if (!raw) continue;
    const normalized = normalizeIpForIntel(raw);
    if (!normalized) continue;
    normalizedByRaw.set(raw, normalized);
    if (isPublicIp(normalized)) candidates.add(normalized);
  }

  if (candidates.size === 0) return result;

  const byIp = new Map<string, IpIntelView>();

  try {
    const cached = await readCache([...candidates]);
    const now = Date.now();
    const stale: string[] = [];

    for (const ip of candidates) {
      const row = cached.get(ip);
      if (row) byIp.set(ip, row);
      if (!row || !isFresh(row, now)) stale.push(ip);
    }

    if (isEnabled() && stale.length > 0) {
      const maxLookups = options.maxLookups ?? DEFAULT_MAX_LOOKUPS;
      const deadline = Date.now() + (options.deadlineMs ?? DEFAULT_DEADLINE_MS);
      const queue = stale.slice(0, maxLookups);

      await runPool(queue, LOOKUP_CONCURRENCY, async (ip) => {
        if (Date.now() > deadline) return;
        try {
          const intel = await enrichIp(ip);
          byIp.set(ip, intel);
          await persist(intel, (cached.get(ip)?.attempts ?? 0) + 1);
        } catch (error) {
          console.error(
            JSON.stringify({
              event: "ip_intel_lookup_failed",
              ip,
              message: error instanceof Error ? error.message : String(error),
            }),
          );
        }
      });
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "ip_intel_unavailable",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  for (const [raw, normalized] of normalizedByRaw) {
    const intel = byIp.get(normalized);
    if (intel) result.set(raw, intel);
  }

  return result;
}

/** Cache-only country lookup for aggregates — never calls a provider. */
export async function getCachedIpCountries(
  rawIps: Array<string | null | undefined>,
): Promise<Map<string, { countryCode: string | null; countryName: string | null }>> {
  const normalizedByRaw = new Map<string, string>();
  for (const raw of rawIps) {
    if (!raw) continue;
    const normalized = normalizeIpForIntel(raw);
    if (normalized) normalizedByRaw.set(raw, normalized);
  }

  const result = new Map<
    string,
    { countryCode: string | null; countryName: string | null }
  >();
  if (normalizedByRaw.size === 0) return result;

  try {
    const unique = [...new Set(normalizedByRaw.values())];
    const byIp = new Map<
      string,
      { countryCode: string | null; countryName: string | null }
    >();

    for (const batch of chunk(unique, IN_CHUNK_SIZE)) {
      const rows = await db.ipIntel.findMany({
        where: { ip: { in: batch }, countryCode: { not: null } },
        select: { ip: true, countryCode: true, countryName: true },
      });
      for (const row of rows) {
        byIp.set(row.ip, {
          countryCode: row.countryCode,
          countryName: row.countryName ?? countryNameFromCode(row.countryCode),
        });
      }
    }

    for (const [raw, normalized] of normalizedByRaw) {
      const hit = byIp.get(normalized);
      if (hit) result.set(raw, hit);
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "ip_intel_country_lookup_failed",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  return result;
}

/**
 * Warm the cache for IPs seen recently, busiest first. Run from the search-intel
 * cron so admin panels stay fully enriched without paying for lookups on render.
 */
export async function backfillRecentIpIntel(
  options: { days?: number; maxLookups?: number; deadlineMs?: number } = {},
): Promise<{ candidates: number; enriched: number }> {
  const days = options.days ?? 7;
  const maxLookups = options.maxLookups ?? 300;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const grouped = await db.searchEvent.groupBy({
    by: ["ipAddress"],
    where: { ipAddress: { not: null }, createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { ipAddress: "desc" } },
    take: maxLookups * 4,
  });

  const ips = grouped
    .map((row) => row.ipAddress)
    .filter((ip): ip is string => Boolean(ip));

  const before = await getCachedIpCountries(ips);
  await getIpIntelMap(ips, {
    maxLookups,
    deadlineMs: options.deadlineMs ?? 120_000,
  });
  const after = await getCachedIpCountries(ips);

  return { candidates: ips.length, enriched: after.size - before.size };
}
