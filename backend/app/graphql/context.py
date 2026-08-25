from fastapi import Request
from app.core.redis import get_redis
from app.core.supabase import get_supabase


async def get_context(request: Request):
  return {
      "request": request,
      "redis": get_redis(),
      "supabase": get_supabase(),
  }
