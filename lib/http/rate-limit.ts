import "server-only";

/**
 * Fixed-window, in-memory rate limiter.
 *
 * Adequate for a single Node.js instance. When running several instances
 * (serverless, multiple containers) replace the store with a shared one
 * (e.g. Redis/Upstash) behind the same `rateLimit()` signature.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  };
}

export const RATE_LIMITS = {
  registration: { limit: 10, windowMs: 10 * 60_000 },
  login: { limit: 10, windowMs: 15 * 60_000 },
  publicLookup: { limit: 60, windowMs: 60_000 },
  admin: { limit: 300, windowMs: 60_000 },
} as const;
