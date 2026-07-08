import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Redis } from '@upstash/redis';

async function test() {
  console.log('Testing Redis connection with .env.local...');
  
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in .env.local');
    process.exit(1);
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    await redis.set('test-key', 'Hello Upstash');
    const val = await redis.get('test-key');
    console.log('Value from Redis:', val);
  } catch (err) {
    console.error('Redis Error:', err);
  }
}

test();
