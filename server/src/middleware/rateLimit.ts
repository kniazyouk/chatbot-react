import type { Request, Response, NextFunction } from 'express';

const hits = new Map<string, number>();

export function rateLimit(
  windowMs: number = Number(process.env.RATE_LIMIT_WINDOW_MS) || 10000,
  maxHits: number = Number(process.env.RATE_LIMIT_MAX_HITS) || 5,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    const userHits = Array.from(hits.entries())
      .filter(([k]) => k.startsWith(key))
      .map(([_, t]) => t)
      .filter(t => t > windowStart);

    if (userHits.length >= maxHits) {
      res.status(429).json({ error: `Too many requests. Please wait before sending another message. (${maxHits} per ${windowMs / 1000}s)` });
      return;
    }

    const hitKey = `${key}:${now}`;
    hits.set(hitKey, now);
    setTimeout(() => hits.delete(hitKey), windowMs);

    next();
  };
}
