import os
from typing import List, Optional
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from app.core.auth import AuthUser, get_current_user, get_optional_user
from app.core.supabase import get_supabase
from app.models.analytics import UrlAnalyticsResponse
from app.models.url import UrlCreateRequest, UrlResponse
from app.services.analytics_service import AnalyticsService
from app.services.url_service import UrlService

router = APIRouter(prefix="/api/urls", tags=["URLs"])


def get_base_url(request: Optional[Request] = None) -> str:
  # 1. Environment variable override (e.g. custom short domain or production base URL)
  app_url = (
      os.getenv("SHORT_URL_BASE")
      or os.getenv("NEXT_PUBLIC_SHORT_DOMAIN")
      or os.getenv("APP_URL")
      or os.getenv("NEXT_PUBLIC_APP_URL")
  )
  if app_url and app_url not in ("https://", "http://", "/"):
    return app_url.rstrip("/")

  if request:
    # 2. Check Origin or Referer from frontend request
    origin = request.headers.get("origin")
    if origin and "http" in origin:
      return origin.rstrip("/")

    referer = request.headers.get("referer")
    if referer:
      try:
        parsed = urlparse(referer)
        if parsed.scheme and parsed.netloc:
          return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
      except Exception:
        pass

    # 3. Check forwarded proto/host from reverse proxy or client headers
    forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    forwarded_host = request.headers.get("x-forwarded-host", request.headers.get("host", "localhost:3000"))
    return f"{forwarded_proto}://{forwarded_host}".rstrip("/")

  return "http://localhost:3000"


@router.post("", response_model=UrlResponse, status_code=status.HTTP_201_CREATED)
async def create_short_url(
    payload: UrlCreateRequest,
    request: Request,
    current_user: Optional[AuthUser] = Depends(get_optional_user),
):
  """Create a shortened URL using Base64 encoding.

  If user is logged in, maps the URL to the user_id profile (indexed in DB).
  Caches the URL in Redis for sub-5ms redirection.
  """
  try:
    base_url = get_base_url(request)
    user_id = current_user.id if current_user else None
    result = await UrlService.shorten_url(
        request=payload,
        user_id=user_id,
        base_url=base_url,
    )
    return result
  except ValueError as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
  except Exception as e:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Internal error creating short URL: {str(e)}",
    )


@router.get("", response_model=List[UrlResponse])
async def list_user_urls(
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
):
  """Fetch all shortened URLs belonging to the authenticated user.

  Optimized using the idx_urls_user_id database index.
  """
  try:
    base_url = get_base_url(request)
    urls = await UrlService.get_user_urls(
        user_id=current_user.id,
        base_url=base_url,
    )
    return urls
  except Exception as e:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Failed to fetch user URLs: {str(e)}",
    )


@router.delete("/{url_id}")
async def delete_url(
    url_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
  """Delete a shortened URL created by the authenticated user."""
  success = await UrlService.delete_user_url(url_id=url_id, user_id=current_user.id)
  if not success:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="URL not found or not owned by current user",
    )
  return {"success": True, "message": "URL deleted successfully"}


@router.get("/resolve/{short_code}", response_class=RedirectResponse)
async def resolve_short_url(short_code: str, request: Request):
  """Resolve short code to original URL and issue HTTP 302 Temporary Redirect."""
  original_url = await UrlService.get_original_url(short_code, request=request)
  if not original_url:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Short URL '{short_code}' was not found or is currently inactive",
    )
  return RedirectResponse(
      url=original_url,
      status_code=status.HTTP_302_FOUND,
      headers={
          "Cache-Control": "no-store",
      },
  )


@router.get("/{url_id}/analytics", response_model=UrlAnalyticsResponse)
async def get_url_analytics(
    url_id: str,
    range: str = "30d",
    current_user: AuthUser = Depends(get_current_user),
):
  """Retrieve detailed analytics for an owned shortened URL.

  Verifies that the URL belongs to the authenticated user.
  Supports range parameter: 7d, 30d, 90d, all.
  """
  supabase = get_supabase()
  if not supabase:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Database client not initialized",
    )

  fetch = (
      supabase.table("urls")
      .select("id, user_id, short_code, original_url, title, clicks_count, created_at, updated_at")
      .eq("id", url_id)
      .maybe_single()
      .execute()
  )
  if not fetch or not fetch.data:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="URL not found",
    )

  if fetch.data.get("user_id") != current_user.id:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to view analytics for this URL",
    )

  valid_ranges = {"7d", "30d", "90d", "all"}
  clean_range = range.lower() if range.lower() in valid_ranges else "30d"

  analytics = await AnalyticsService.get_url_analytics(
      url_record=fetch.data,
      time_range=clean_range,
  )
  return analytics


