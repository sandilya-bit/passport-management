import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { ApiError } from '../utils/api-error';

const localCounters = new Map<string, { count: number; expiresAt: number }>();
let lastCleanup = 0;

export function createRateLimiter(bucket: string, limit: number, windowSeconds: number): RequestHandler {
  return async (request, _response, next) => {
    const ipHash = createHash('sha256').update(request.ip ?? 'unknown').digest('hex').slice(0, 24);
    const key = `pams:rate:${bucket}:${ipHash}`;
    try {
      let count: number;
      if (redis?.isReady) {
        const result = await redis.eval(
          "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return count",
          { keys: [key], arguments: [String(windowSeconds)] },
        );
        count = Number(result);
      } else {
        if (redis && env.NODE_ENV === 'production') throw new ApiError(503, 'Rate-limit service is unavailable.');
        const now = Date.now();
        const record = localCounters.get(key);
        count = record && record.expiresAt > now ? record.count + 1 : 1;
        localCounters.set(key, { count, expiresAt: now + windowSeconds * 1000 });
        if (now - lastCleanup > 60_000) {
          for (const [counterKey, counter] of localCounters) if (counter.expiresAt <= now) localCounters.delete(counterKey);
          lastCleanup = now;
        }
      }
      if (count > limit) throw new ApiError(429, 'Too many requests. Please try again later.');
      next();
    } catch (error) {
      next(redis && env.NODE_ENV === 'production' ? new ApiError(503, 'Rate-limit service is unavailable.') : error);
    }
  };
}