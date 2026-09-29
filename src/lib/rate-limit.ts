/**
 * In-memory sliding window rate limiter for authentication & sensitive endpoints
 */

interface RateLimitRecord {
  timestamps: number[];
}

const cache = new Map<string, RateLimitRecord>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of cache.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 60000);
      if (record.timestamps.length === 0) {
        cache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Check rate limit for an identifier (e.g. IP address or email)
 * @param key unique identifier (e.g. `login:${ip}`)
 * @param limit maximum allowed requests within windowMs
 * @param windowMs time window in milliseconds (default: 60,000 = 1 minute)
 */
export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60000
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  let record = cache.get(key);

  if (!record) {
    record = { timestamps: [] };
    cache.set(key, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const retryAfterMs = windowMs - (now - oldest);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(1000, retryAfterMs),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    retryAfterMs: 0,
  };
}
