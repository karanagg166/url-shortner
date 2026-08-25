import os
import redis.asyncio as aioredis

redis_client = None


async def init_redis():
  global redis_client
  host = os.getenv("REDIS_HOST", "redis")
  port = int(os.getenv("REDIS_PORT", "6379"))
  redis_client = aioredis.Redis(host=host, port=port, decode_responses=True)
  return redis_client


async def close_redis():
  global redis_client
  if redis_client:
    await redis_client.close()


def get_redis():
  return redis_client
