/**
 * Simple in-memory sliding window rate limiter.
 * For production at scale, replace with Redis-based solution.
 */

const tokenBuckets = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of tokenBuckets) {
        if (now - bucket.lastAccess > 300_000) {
            tokenBuckets.delete(key);
        }
    }
}, 300_000);

/**
 * Create a rate limiter with given config.
 * @param {Object} options
 * @param {number} options.interval - Time window in milliseconds (default: 60000 = 1 min)
 * @param {number} options.limit - Max requests per interval (default: 30)
 * @returns {Function} - (req) => { success: boolean, remaining: number, reset: number }
 */
export function rateLimit({ interval = 60_000, limit = 30 } = {}) {
    return function check(identifier) {
        const now = Date.now();
        const bucket = tokenBuckets.get(identifier) || { tokens: [], lastAccess: now };

        // Remove expired tokens
        bucket.tokens = bucket.tokens.filter(t => now - t < interval);
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

// ─── Pre-configured limiters ───────────────────────────────────

/** Standard API: 30 req/min */
export const standardLimiter = rateLimit({ interval: 60_000, limit: 30 });

/** AI-heavy endpoints: 10 req/min */
export const aiLimiter = rateLimit({ interval: 60_000, limit: 10 });

/** Auth endpoints: 5 req/15 min per email */
export const authLimiter = rateLimit({ interval: 900_000, limit: 5 });

/**
 * Get rate limit identifier from a request.
 * Uses forwarded IP or falls back to a default.
 */
export function getRateLimitKey(req, suffix = '') {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    return `${ip}${suffix ? ':' + suffix : ''}`;
}
