from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from strawberry.fastapi import GraphQLRouter

from app.api.urls import router as urls_router
from app.core.redis import close_redis, init_redis
from app.core.supabase import init_supabase
from app.graphql.context import get_context
from app.graphql.schema import schema
from app.services.url_service import UrlService


@asynccontextmanager
async def lifespan(app: FastAPI):
  await init_redis()
  init_supabase()
  yield
  await close_redis()


app = FastAPI(
    title="URL Shortener API",
    description="High-performance URL Shortener with Redis Caching and Supabase Auth",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GraphQL Router
graphql_app = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_app, prefix="/graphql")

# REST API Router for URLs
app.include_router(urls_router)


@app.get("/health")
async def health():
  return {"status": "healthy", "service": "url-shortener-backend"}


# Temporary Redirect (HTTP 307) Route
@app.get("/{short_code}", response_class=RedirectResponse)
async def redirect_short_url(short_code: str):
  """Resolve short code to original URL and issue HTTP 307 Temporary Redirect.

  Temporary redirect (307) avoids aggressive browser caching so every click
  can be accurately tracked and monitored in real-time.
  """
  reserved_keywords = {
      "health",
      "graphql",
      "docs",
      "redoc",
      "openapi.json",
      "favicon.ico",
      "api",
  }
  if short_code in reserved_keywords:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail="Not a valid short code"
    )

  original_url = await UrlService.get_original_url(short_code)
  if not original_url:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Short URL '{short_code}' was not found or is currently inactive",
    )

  return RedirectResponse(
      url=original_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT
  )
