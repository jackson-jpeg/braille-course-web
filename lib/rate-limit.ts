// In-memory rate limiter — state resets on each serverless cold start.
// Acceptable for the admin login endpoint (password is the primary defense).
// For stricter guarantees, swap to Vercel KV or Upstash Redis.

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX = 5;

// Routes that need higher limits
const ROUTE_LIMITS: Record<string, number> = {
  'enrollment-status': 60,
  'game-progress': 60,
  sections: 60,
};

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  // Clean up expired entry
  if (entry && now >= entry.resetAt) {
    attempts.delete(key);
  }

  const current = attempts.get(key);

  // Determine max attempts from the route prefix (e.g. "enrollment-status:1.2.3.4" → "enrollment-status")
  const routePrefix = key.split(':')[0];
  const max = ROUTE_LIMITS[routePrefix] ?? DEFAULT_MAX;

  if (!current) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= max) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  current.count++;
  return { allowed: true, retryAfter: 0 };
}

export function clearRateLimit(ip: string): void {
  attempts.delete(ip);
}
