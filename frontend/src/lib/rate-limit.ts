// ==========================================
// Stage 6.2: In-Memory Rate Limiter
// Production: replace with Redis (upstash/redis)
// ==========================================

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
    /** Max requests in the window */
    maxRequests: number;
    /** Window duration in seconds */
    windowSeconds: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * Check rate limit for a given key.
 * Returns whether the request is allowed plus remaining quota.
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt < now) {
        // New window
        const resetAt = now + config.windowSeconds * 1000;
        store.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: config.maxRequests - 1, resetAt };
    }

    if (entry.count >= config.maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetAt: entry.resetAt,
    };
}

// ==========================================
// Predefined Rate Limit Configs
// ==========================================

export const RATE_LIMITS = {
    /** POST unlock: 10 requests per 60 seconds */
    unlock: { maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,
    /** POST redeem: 5 requests per 60 seconds */
    redeem: { maxRequests: 5, windowSeconds: 60 } as RateLimitConfig,
    /** Gamification reward: 30 requests per 60 seconds */
    reward: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
    /** Login: 5 requests per 300 seconds (5 min) */
    login: { maxRequests: 5, windowSeconds: 300 } as RateLimitConfig,
    /** Checkout: 3 requests per 60 seconds */
    checkout: { maxRequests: 3, windowSeconds: 60 } as RateLimitConfig,
    /** Comments: 10 per 60 seconds */
    comment: { maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,
    /** Generic API: 60 per 60 seconds */
    api: { maxRequests: 60, windowSeconds: 60 } as RateLimitConfig,
} as const;
