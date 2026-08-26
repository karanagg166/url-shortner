from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.supabase import get_supabase

security = HTTPBearer(auto_error=False)


class AuthUser:

  def __init__(self, id: str, email: Optional[str] = None):
    self.id = id
    self.email = email


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> AuthUser:
  """Authenticate the user using Supabase JWT Bearer token or development fallback."""
  token = None
  if (
      credentials
      and hasattr(credentials, "credentials")
      and credentials.credentials
  ):
    token = credentials.credentials
  else:
    auth_header = request.headers.get("authorization") or request.headers.get(
        "Authorization"
    )
    if auth_header and auth_header.lower().startswith("bearer "):
      token = auth_header[7:].strip()

  # 1. Check Bearer token from Supabase
  if token:
    supabase = get_supabase()
    if not supabase:
      raise HTTPException(
          status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
          detail="Supabase client not initialized",
      )

    try:
      user_response = supabase.auth.get_user(token)
      if user_response and user_response.user:
        return AuthUser(
            id=str(user_response.user.id), email=user_response.user.email
        )
      raise HTTPException(
          status_code=status.HTTP_401_UNAUTHORIZED,
          detail="Invalid or expired authentication token",
      )
    except Exception as e:
      raise HTTPException(
          status_code=status.HTTP_401_UNAUTHORIZED,
          detail=f"Authentication failed: {str(e)}",
      )

  # 2. Check X-User-Id header for development/testing environments
  dev_user_id = request.headers.get("x-user-id") or request.headers.get(
      "X-User-Id"
  )
  if dev_user_id:
    return AuthUser(
        id=dev_user_id,
        email=request.headers.get("x-user-email", "dev@user.local"),
    )

  raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Authentication required. Please provide a Bearer token or log in.",
      headers={"WWW-Authenticate": "Bearer"},
  )


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[AuthUser]:
  """Extract user if authenticated, otherwise return None without throwing."""
  try:
    return await get_current_user(request, credentials)
  except HTTPException:
    return None
