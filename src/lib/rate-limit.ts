/**
 * Rate limiter.
 *
 * Uses Upstash Redis REST when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are configured. Falls back to in-memory limits for
 * local development.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

/**
 * Check (and consume) one request against a fixed-window counter.
 *
 * @param key     Unique identifier – usually `${ip}:${routeGroup}`
 * @param limit   Max requests allowed in `windowMs`
 * @param windowMs  Window size in milliseconds
 * @returns       `ok` = allowed, plus remaining quota & reset timestamp
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; reset: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // First request in this window (or window expired)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, reset: now + windowMs };
  }

  // Window still active – check quota
  if (entry.count >= limit) {
    return { ok: false, remaining: 0, reset: entry.resetAt };
  }

  entry.count++;
  return { ok: true, remaining: limit - entry.count, reset: entry.resetAt };
}

async function upstashCommand(command: unknown[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Upstash rate-limit command failed with ${res.status}`);
  }

  const data = (await res.json()) as { result?: unknown };
  return data.result;
}

export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; remaining: number; reset: number }> {
  const redisKey = `rate:${key}`;
  const now = Date.now();

  try {
    const count = Number(await upstashCommand(["INCR", redisKey]));

    if (!Number.isFinite(count) || count <= 0) {
      return rateLimit(key, limit, windowMs);
    }

    if (count === 1) {
      await upstashCommand(["PEXPIRE", redisKey, windowMs]);
    }

    const ttl = Number(await upstashCommand(["PTTL", redisKey]));
    const reset = now + Math.max(ttl, 0);
    const remaining = Math.max(0, limit - count);

    return { ok: count <= limit, remaining, reset };
  } catch {
    return rateLimit(key, limit, windowMs);
  }
}
