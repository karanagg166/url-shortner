import os
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from app.core.supabase import get_supabase

security = HTTPBearer(auto_error=False)

_jwks_client: Optional[jwt.PyJWKClient] = None


def get_jwks_client() -> Optional[jwt.PyJWKClient]:
  global _jwks_client
  if _jwks_client is None:
    jwks_url = (
        os.getenv("SUPABASE_JWKS_URL")
        or (
            f"{os.getenv('SUPABASE_URL', '').rstrip('/')}/auth/v1/.well-known/jwks.json"
            if os.getenv("SUPABASE_URL")
            else None
        )
    )
    if jwks_url and not jwks_url.startswith("/"):
      try:
        _jwks_client = jwt.PyJWKClient(jwks_url)
      except Exception:
        _jwks_client = None
  return _jwks_client


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
    # 1A. Try Supabase client auth verification
    supabase = get_supabase()
    if supabase:
      try:
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
          return AuthUser(
              id=str(user_response.user.id), email=user_response.user.email
          )
      except Exception:
        # Fall back to cryptographic JWKS verification
        pass

    # 1B. Cryptographic JWKS fallback (supports ES256 & HS256)
    try:
      jwks_client = get_jwks_client()
      if jwks_client:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "HS256"],
            options={"verify_aud": False},
        )
        user_id = payload.get("sub")
        if user_id:
          return AuthUser(id=str(user_id), email=payload.get("email"))
    except Exception:
      pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
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
