import type { Request, Response, NextFunction } from 'express';

const hits = new Map<string, number>();

export function rateLimit(windowMs: number = 5000, maxHits: number = 1) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    const userHits = Array.from(hits.entries())
      .filter(([k]) => k.startsWith(key))
      .map(([_, t]) => t)
      .filter(t => t > windowStart);

    if (userHits.length >= maxHits) {
      res.status(429).json({ error: 'You are sending requests too quickly. Please wait a moment.' });
      return;
    }

    const hitKey = `${key}:${now}`;
    hits.set(hitKey, now);
    setTimeout(() => hits.delete(hitKey), windowMs);

    next();
  };
}
