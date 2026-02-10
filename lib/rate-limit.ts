// In-memory rate limiter — state resets on each serverless cold start.
// Acceptable for the admin login endpoint (password is the primary defense).
// For stricter guarantees, swap to Vercel KV or Upstash Redis.

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, RateLimitEntry>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = attempts.get(ip);

  // Clean up expired entry
  if (entry && now >= entry.resetAt) {
    attempts.delete(ip);
  }

  const current = attempts.get(ip);

  if (!current) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  current.count++;
  return { allowed: true, retryAfter: 0 };
}

export function clearRateLimit(ip: string): void {
  attempts.delete(ip);
}
