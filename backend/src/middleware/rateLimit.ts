import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}
const requestCounts = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientKey = req.ip || req.connection.remoteAddress || 'unknown';

  const now = Date.now();
  const entry = requestCounts.get(clientKey);

  if (!entry) {
    // First request from this client
    requestCounts.set(clientKey, {
      count: 1,
      firstRequest: now
    });
    next();
    return;
  }

  // Check if window has expired
  if (now - entry.firstRequest > WINDOW_MS) {
    requestCounts.set(clientKey, {
      count: 1,
      firstRequest: now
    });
    next();
    return;
  }

  // Within window, increment count
  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((entry.firstRequest + WINDOW_MS - now) / 1000)
    });
  }

  next();
};
export const cleanupRateLimits = () => {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (now - entry.firstRequest > WINDOW_MS * 2) {
      requestCounts.delete(key);
    }
  }
};

// Stricter rate limit for auth endpoints
export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientKey = `auth:${req.ip || 'unknown'}`;
  const now = Date.now();
  const entry = requestCounts.get(clientKey);

  // Only 10 auth attempts per minute
  const AUTH_MAX_REQUESTS = 10;

  if (!entry) {
    requestCounts.set(clientKey, { count: 1, firstRequest: now });
    next();
    return;
  }

  if (now - entry.firstRequest > WINDOW_MS) {
    requestCounts.set(clientKey, { count: 1, firstRequest: now });
    next();
    return;
  }

  entry.count++;

  if (entry.count > AUTH_MAX_REQUESTS) {
    console.log(`Rate limited auth attempt from ${req.ip}`);
    return res.status(429).json({
      error: 'Too many authentication attempts. Please try again later.'
    });
  }

  next();
};
