/**
 * Simple in-memory sliding window rate limiter.
 * For production at scale, replace with Redis-based solution.
 */

interface Bucket {
  tokens: number[];
  lastAccess: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

interface RateLimitOptions {
  interval?: number;
  limit?: number;
}

const tokenBuckets = new Map<string, Bucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of tokenBuckets.entries()) {
    if (now - bucket.lastAccess > 300_000) {
      tokenBuckets.delete(key);
    }
  }
}, 300_000);

export function rateLimit({ interval = 60_000, limit = 30 }: RateLimitOptions = {}): (identifier: string) => RateLimitResult {
  return function check(identifier: string): RateLimitResult {
    const now = Date.now();
    const bucket = tokenBuckets.get(identifier) || { tokens: [], lastAccess: now };

    bucket.tokens = bucket.tokens.filter((t) => now - t < interval);
    bucket.lastAccess = now;

    if (bucket.tokens.length >= limit) {
      tokenBuckets.set(identifier, bucket);
      const oldestToken = Math.min(...bucket.tokens);
      return {
        success: false,
        remaining: 0,
        reset: Math.ceil((oldestToken + interval - now) / 1000),
      };
    }

    bucket.tokens.push(now);
    tokenBuckets.set(identifier, bucket);

    return {
      success: true,
      remaining: limit - bucket.tokens.length,
      reset: Math.ceil(interval / 1000),
    };
  };
}

export const standardLimiter = rateLimit({ interval: 60_000, limit: 30 });
export const aiLimiter = rateLimit({ interval: 60_000, limit: 10 });
export const authLimiter = rateLimit({ interval: 900_000, limit: 5 });

/**
 * Get rate limit identifier from a request.
 */
export function getRateLimitKey(req: { headers: { get: (name: string) => string | null } }, suffix = ''): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `${ip}${suffix ? ':' + suffix : ''}`;
}
