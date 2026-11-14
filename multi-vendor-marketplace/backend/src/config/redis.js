import Redis from "ioredis";

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times <= 2 ? 1000 : null)
    })
  : null;

if (redis) {
  redis.on("error", (err) => console.error("Redis:", err.message));
  redis.connect().catch((err) => console.warn("Redis unavailable; using memory fallback:", err.message));
}

export default redis;
