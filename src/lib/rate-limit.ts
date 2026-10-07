/**
 * Prosty rate-limit w pamięci procesu (wystarczy na 1 instancję PM2).
 * Klucz → lista timestampów prób.
 */
type Bucket = { hits: number[]; windowMs: number };

const store = new Map<string, Bucket>();
const MAX_KEYS = 50_000;
let lastSweep = 0;

export type RateLimitResult = {
  ok: boolean;
  retryAfterSec: number;
};

function sweep(now: number) {
  if (now - lastSweep < 60_000 && store.size < MAX_KEYS) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    const newest = bucket.hits[bucket.hits.length - 1] ?? 0;
    if (newest <= now - bucket.windowMs) store.delete(key);
  }
  if (store.size >= MAX_KEYS) store.clear();
}

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const windowStart = now - opts.windowMs;
  const recent = (store.get(key)?.hits ?? []).filter((t) => t > windowStart);
  if (recent.length >= opts.limit) {
    const oldest = recent[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + opts.windowMs - now) / 1000));
    store.set(key, { hits: recent, windowMs: opts.windowMs });
    return { ok: false, retryAfterSec };
  }
  recent.push(now);
  store.set(key, { hits: recent, windowMs: opts.windowMs });
  return { ok: true, retryAfterSec: 0 };
}

/**
 * IP klienta za Nginx. `X-Real-IP` ustawia proxy (klient nie może go nadpisać);
 * w `X-Forwarded-For` zaufany jest tylko ostatni wpis — dopisany przez Nginx.
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",").pop()?.trim() || "unknown";
  return "unknown";
}
