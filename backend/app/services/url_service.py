import base64
import os
import re
from typing import List, Optional
from urllib.parse import urlparse
from app.core.redis import get_redis
from app.core.supabase import get_supabase
from app.models.url import UrlCreateRequest, UrlResponse, UrlStatsResponse


class UrlService:

  @staticmethod
  def is_valid_url(url: str) -> bool:
    try:
      result = urlparse(url)
      return bool(result.scheme in ("http", "https") and result.netloc)
    except Exception:
      return False

  @staticmethod
  def generate_base64_code(length: int = 7) -> str:
    """Generate a compact URL-safe Base64 encoded short slug.

    Uses cryptographically secure random bytes encoded via URL-safe Base64 (RFC
    4648) with padding stripped.
    """
    while True:
      # 6 bytes yield 8 base64 characters
      raw = os.urandom(6)
      code = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
      # Keep clean alphanumeric characters or URL-safe hyphen/underscore
      if len(code) >= length:
        return code[:length]

  @staticmethod
  def format_short_url(short_code: str, base_url: str = "https://") -> str:
    if not base_url or base_url in ("https://", "http://", "/"):
      return f"https://{short_code}"
    cleaned = base_url.rstrip("/")
    if cleaned.endswith("://"):
      return f"{cleaned}{short_code}"
    return f"{cleaned}/{short_code}"

  @classmethod
  async def shorten_url(
      cls,
      request: UrlCreateRequest,
      user_id: Optional[str] = None,
      base_url: str = "https://",
  ) -> UrlResponse:
    supabase = get_supabase()
    redis = get_redis()

    raw_url = request.original_url.strip()
    if not (raw_url.startswith("http://") or raw_url.startswith("https://")):
      raw_url = "https://" + raw_url

    if not cls.is_valid_url(raw_url):
      raise ValueError(f"Invalid URL format: '{request.original_url}'")

    # 1. Determine Short Code (Custom alias or Base64 generated)
    short_code = None
    if request.custom_slug and request.custom_slug.strip():
      clean_slug = (
          re.sub(r"[^a-zA-Z0-9-_]", "", request.custom_slug.strip().lower())
      )
      if clean_slug:
        # Check if already taken
        if redis:
          cached = await redis.get(f"url:{clean_slug}")
          if cached:
            raise ValueError(f"Custom slug '{clean_slug}' is already in use.")

        existing = (
            supabase.table("urls")
            .select("id")
            .eq("short_code", clean_slug)
            .maybe_single()
            .execute()
        )
        if existing and existing.data:
          raise ValueError(f"Custom slug '{clean_slug}' is already taken.")
        short_code = clean_slug

    # If no custom slug, generate unique Base64 short code
    if not short_code:
      for _ in range(5):  # Collision retry loop
        candidate = cls.generate_base64_code(length=7)
        if redis and await redis.exists(f"url:{candidate}"):
          continue
        db_check = (
            supabase.table("urls")
            .select("id")
            .eq("short_code", candidate)
            .maybe_single()
            .execute()
        )
        if not (db_check and db_check.data):
          short_code = candidate
          break
      if not short_code:
        short_code = cls.generate_base64_code(length=8)

    # 2. Verify and assign user_id
    valid_user_id = None
    if user_id:
      try:
        profile_check = (
            supabase.table("profiles")
            .select("id")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        if profile_check and profile_check.data:
          valid_user_id = user_id
        else:
          # If user exists in auth, attempt profile sync
          supabase.table("profiles").insert(
              {"id": user_id, "email": f"{user_id}@user.local"}
          ).execute()
          valid_user_id = user_id
      except Exception as err:
        print(f"Warning verifying user_id {user_id}: {err}")
        valid_user_id = None

    # 3. Insert into Supabase with UNIQUE short_code constraint enforcement
    insert_payload = {
        "original_url": raw_url,
        "short_code": short_code,
        "title": request.title or raw_url,
        "user_id": valid_user_id,
        "is_active": True,
        "clicks_count": 0,
    }

    result = None
    try:
      result = supabase.table("urls").insert(insert_payload).execute()
    except Exception as e:
      err_msg = str(e)
      # If custom slug collided, inform user
      if request.custom_slug:
        raise ValueError(
            f"Custom slug '{short_code}' is already taken. Please choose another one."
        )

      # If auto-generated Base64 collision occurred, retry with a fresh code
      for _ in range(3):
        new_code = cls.generate_base64_code(length=8)
        insert_payload["short_code"] = new_code
        try:
          result = supabase.table("urls").insert(insert_payload).execute()
          short_code = new_code
          break
        except Exception:
          continue

      if not result or not result.data:
        raise RuntimeError(
            f"Database unique constraint violation on short_code: {err_msg}"
        )

    if not result.data:
      raise RuntimeError("Failed to create short URL in database")

    record = result.data[0]

    # 3. Cache in Redis for sub-5ms lookups (7-day TTL)
    if redis:
      try:
        await redis.set(f"url:{short_code}", raw_url, ex=604800)
        await redis.set(f"clicks:{short_code}", 0)
      except Exception as e:
        print(f"Warning: Redis cache set failed: {e}")

    return UrlResponse(
        id=record["id"],
        user_id=record.get("user_id"),
        original_url=record["original_url"],
        short_code=record["short_code"],
        short_url=cls.format_short_url(record["short_code"], base_url),
        title=record.get("title"),
        clicks_count=record.get("clicks_count", 0),
        qr_code_svg=record.get("qr_code_svg"),
        is_active=record.get("is_active", True),
        created_at=record.get("created_at"),
        updated_at=record.get("updated_at"),
    )

  @classmethod
  async def get_user_urls(
      cls, user_id: str, base_url: str = "https://"
  ) -> List[UrlResponse]:
    """Fetch all shortened URLs belonging to the authenticated user.

    Directly leverages the idx_urls_user_id database index.
    """
    supabase = get_supabase()
    redis = get_redis()

    # Query with user_id index filter
    response = (
        supabase.table("urls")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    items = response.data or []
    urls = []

    for item in items:
      code = item["short_code"]
      clicks = item.get("clicks_count", 0)

      # Check real-time Redis counter if higher
      if redis:
        try:
          cached_clicks = await redis.get(f"clicks:{code}")
          if cached_clicks and int(cached_clicks) > clicks:
            clicks = int(cached_clicks)
        except Exception:
          pass

      urls.append(
          UrlResponse(
              id=item["id"],
              user_id=item.get("user_id"),
              original_url=item["original_url"],
              short_code=code,
              short_url=cls.format_short_url(code, base_url),
              title=item.get("title"),
              clicks_count=clicks,
              qr_code_svg=item.get("qr_code_svg"),
              is_active=item.get("is_active", True),
              created_at=item.get("created_at"),
              updated_at=item.get("updated_at"),
          )
      )

    return urls

  @classmethod
  async def get_original_url(cls, short_code: str) -> Optional[str]:
    """Resolve short code to original URL using Redis-first caching strategy,

    and increment click metrics.
    """
    redis = get_redis()
    supabase = get_supabase()

    # 1. Fast path: Redis cache hit (sub-5ms)
    if redis:
      try:
        cached_url = await redis.get(f"url:{short_code}")
        if cached_url:
          await redis.incr(f"clicks:{short_code}")
          # Sync click to DB in background
          try:
            supabase.rpc(
                "increment_clicks", {"slug": short_code}
            ).execute()
          except Exception:
            # Fallback direct update
            supabase.table("urls").update({
                "clicks_count": (
                    supabase.table("urls")
                    .select("clicks_count")
                    .eq("short_code", short_code)
                    .single()
                    .execute()
                    .data.get("clicks_count", 0)
                    + 1
                )
            }).eq("short_code", short_code).execute()
          return cached_url
      except Exception as e:
        print(f"Redis cache lookup error: {e}")

    # 2. Database lookup
    result = (
        supabase.table("urls")
        .select("id, original_url, clicks_count, is_active")
        .eq("short_code", short_code)
        .maybe_single()
        .execute()
    )

    if not result or not result.data:
      return None

    data = result.data
    if not data.get("is_active", True):
      return None

    original_url = data["original_url"]
    new_clicks = data.get("clicks_count", 0) + 1

    # Update DB click counter
    try:
      supabase.table("urls").update({"clicks_count": new_clicks}).eq(
          "short_code", short_code
      ).execute()
    except Exception as e:
      print(f"Failed to update clicks in DB: {e}")

    # 3. Populate Redis Cache
    if redis:
      try:
        await redis.set(f"url:{short_code}", original_url, ex=604800)
        await redis.set(f"clicks:{short_code}", new_clicks)
      except Exception as e:
        print(f"Failed to set Redis cache: {e}")

    return original_url

  @classmethod
  async def delete_user_url(cls, url_id: str, user_id: str) -> bool:
    """Delete a shortened URL owned by the user."""
    supabase = get_supabase()
    redis = get_redis()

    # Get short code first
    fetch = (
        supabase.table("urls")
        .select("short_code")
        .eq("id", url_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not fetch or not fetch.data:
      return False

    short_code = fetch.data["short_code"]

    # Delete from DB
    supabase.table("urls").delete().eq("id", url_id).eq(
        "user_id", user_id
    ).execute()

    # Invalidate Redis
    if redis:
      try:
        await redis.delete(f"url:{short_code}")
        await redis.delete(f"clicks:{short_code}")
      except Exception:
        pass

    return True
