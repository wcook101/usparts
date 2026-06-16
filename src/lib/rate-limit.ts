type RateLimitOptions = {
  intervalMs: number;
  maxRequests: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

// Prune stale buckets periodically so memory stays bounded on long-running servers.
let lastPrune = Date.now();
const PRUNE_INTERVAL_MS = 60 * 60 * 1000;

function pruneBuckets(now: number) {
  if (now - lastPrune < PRUNE_INTERVAL_MS) {
    return;
  }

  lastPrune = now;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

export function rateLimit(
  key: string,
  options: RateLimitOptions,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  pruneBuckets(now);

  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + options.intervalMs });
    return { ok: true };
  }

  if (existing.count >= options.maxRequests) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true };
}

export function getClientIp(
  headers: Headers,
  fallback = "unknown",
): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return fallback;
}
