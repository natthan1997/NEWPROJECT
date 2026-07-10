const { Redis } = require('@upstash/redis');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
async function run() {
  await redis.del('cache:menu:main');
  await redis.del('cache:menu:1f3fc496-d89e-4323-a66e-4fcd555444e9');
  console.log('done');
}
run();
