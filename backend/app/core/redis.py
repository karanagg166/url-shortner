import os
import redis.asyncio as aioredis

redis_client = None


async def init_redis():
  global redis_client
  upstash_url = os.getenv("UPSTASH_REDIS_REST_URL")
  upstash_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
  redis_url = os.getenv("REDIS_URL")

  if upstash_url and upstash_token:
    # Extract hostname from https://<host>.upstash.io
    host = upstash_url.replace("https://", "").replace("http://", "").split("/")[0]
    redis_client = aioredis.Redis(
        host=host,
        port=6379,
        password=upstash_token,
        ssl=True,
        decode_responses=True,
    )
  elif redis_url:
    redis_client = aioredis.from_url(redis_url, decode_responses=True)
  else:
    host = os.getenv("REDIS_HOST", "redis")
    port = int(os.getenv("REDIS_PORT", "6379"))
    password = os.getenv("REDIS_PASSWORD", None)
    redis_client = aioredis.Redis(
        host=host, port=port, password=password, decode_responses=True
    )
  return redis_client


async def close_redis():
  global redis_client
  if redis_client:
    await redis_client.close()


def get_redis():
  return redis_client
