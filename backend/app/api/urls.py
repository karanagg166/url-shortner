from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from app.core.auth import AuthUser, get_current_user, get_optional_user
from app.models.url import UrlCreateRequest, UrlResponse
from app.services.url_service import UrlService

router = APIRouter(prefix="/api/urls", tags=["URLs"])


def get_base_url(request: Request) -> str:
  # Check forwarded proto/host from reverse proxy or client headers
  forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme)
  forwarded_host = request.headers.get("x-forwarded-host", request.headers.get("host", "localhost:8000"))
  return f"{forwarded_proto}://{forwarded_host}"


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
async def resolve_short_url(short_code: str):
  """Resolve short code to original URL and issue HTTP 307 Temporary Redirect."""
  original_url = await UrlService.get_original_url(short_code)
  if not original_url:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Short URL '{short_code}' was not found or is currently inactive",
    )
  return RedirectResponse(
      url=original_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT
  )

