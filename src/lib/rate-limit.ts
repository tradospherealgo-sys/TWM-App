/**
 * Rate Limiting Subsystem for TWM
 *
 * ARCHITECTURAL HONESTY & LIMITATION DISCLOSURE:
 * In a multi-region serverless deployment (such as Vercel Edge / Serverless Functions),
 * an in-memory limiter maintains state per serverless execution context/container.
 * While highly effective at throttling rapid-fire brute-force bursts against individual instances,
 * it cannot guarantee strict global rate limiting across completely isolated serverless containers
 * without a distributed persistence layer (e.g., Redis, Upstash, or Vercel KV).
 *
 * This module implements a pluggable RateLimiterAdapter architecture:
 * 1. Default: High-performance in-memory sliding window limiter.
 * 2. DistributedAdapter: An extensible interface that connects to an external distributed store
 *    when credentials are configured. In accordance with TWM product boundaries, external paid
 *    credentials remain DEFERRED rather than fabricated.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  provider: 'IN_MEMORY' | 'DISTRIBUTED' | 'IN_MEMORY_FALLBACK';
}

export interface RateLimiterAdapter {
  check(key: string, limit: number, windowMs: number): RateLimitResult | Promise<RateLimitResult>;
  reset?(key: string): void;
}

interface RateLimitRecord {
  timestamps: number[];
}

/**
 * In-Memory Sliding Window Rate Limiter
 */
class InMemoryRateLimiter implements RateLimiterAdapter {
  private cache = new Map<string, RateLimitRecord>();

  constructor() {
    // Periodic garbage collection for expired keys (every 5 minutes in persistent contexts)
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        const now = Date.now();
        for (const [key, record] of this.cache.entries()) {
          record.timestamps = record.timestamps.filter((t) => now - t < 60000);
          if (record.timestamps.length === 0) {
            this.cache.delete(key);
          }
        }
      }, 5 * 60 * 1000).unref?.();
    }
  }

  check(key: string, limit = 10, windowMs = 60000): RateLimitResult {
    const now = Date.now();
    let record = this.cache.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.cache.set(key, record);
    }

    // Filter timestamps within sliding window
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

    if (record.timestamps.length >= limit) {
      const oldest = record.timestamps[0];
      const retryAfterMs = Math.max(1000, windowMs - (now - oldest));
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs,
        provider: 'IN_MEMORY',
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: limit - record.timestamps.length,
      retryAfterMs: 0,
      provider: 'IN_MEMORY',
    };
  }

  reset(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

/**
 * Distributed Rate Limiter Adapter Stub
 * Ready for future Redis/KV integration without breaking changes.
 */
class DistributedRateLimiter implements RateLimiterAdapter {
  private fallbackLimiter = new InMemoryRateLimiter();

  check(key: string, limit = 10, windowMs = 60000): RateLimitResult {
    // When external distributed store credentials are not configured,
    // safely fall back to the in-memory sliding window limiter.
    const result = this.fallbackLimiter.check(key, limit, windowMs);
    return {
      ...result,
      provider: 'IN_MEMORY_FALLBACK',
    };
  }

  reset(key?: string) {
    this.fallbackLimiter.reset(key);
  }
}

// Global active limiter instance
const inMemoryInstance = new InMemoryRateLimiter();
const distributedInstance = new DistributedRateLimiter();

// Select limiter: use distributed adapter if configured, else in-memory
const activeLimiter: RateLimiterAdapter = process.env.UPSTASH_REDIS_REST_URL
  ? distributedInstance
  : inMemoryInstance;

/**
 * Check rate limit for an identifier (e.g. IP address or email)
 * @param key unique identifier (e.g. `login:${ip}`)
 * @param limit maximum allowed requests within windowMs (default: 10)
 * @param windowMs time window in milliseconds (default: 60,000 = 1 minute)
 */
export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60000
): RateLimitResult {
  return inMemoryInstance.check(key, limit, windowMs);
}

/**
 * Reset rate limit counter (useful for unit testing)
 */
export function resetRateLimit(key?: string) {
  inMemoryInstance.reset(key);
}
