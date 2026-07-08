import { Redis } from '@upstash/redis';

// Initialize Redis client
// Note: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in .env.local
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export const CACHE_TTL = {
  MENU: 60 * 5, // 5 minutes
  SETTINGS: 60 * 60, // 1 hour
};
