import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

export function rateLimitMiddleware(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip || req.socket.remoteAddress || "unknown",
    message = "Too many requests, please try again later",
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));
      next();
      return;
    }

    entry.count++;

    if (entry.count > maxRequests) {
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      res.status(429).json({ message });
      return;
    }

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - entry.count);
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));
    next();
  };
}

// Pre-configured rate limiters
export const aiRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: "Too many AI recommendation requests, please try again later",
});

export const authRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 5,
  keyGenerator: (req) => {
    const body = req.body;
    return body?.email || req.ip || "unknown";
  },
  message: "Too many authentication attempts, please try again later",
});
