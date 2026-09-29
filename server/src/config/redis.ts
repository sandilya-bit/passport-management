import { createClient } from 'redis';
import { env } from './env';

export const redis = env.REDIS_URL ? createClient({ url: env.REDIS_URL }) : null;

if (redis) {
  redis.on('error', (error) => console.error('Redis connection error:', error.message));
}