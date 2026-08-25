from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from app.core.redis import init_redis, close_redis
from app.core.supabase import init_supabase
from app.graphql.schema import schema
from app.graphql.context import get_context


@asynccontextmanager
async def lifespan(app: FastAPI):
  await init_redis()
  init_supabase()
  yield
  await close_redis()


app = FastAPI(title="URL Shortener API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graphql_app = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_app, prefix="/graphql")


@app.get("/health")
async def health():
  return {"status": "healthy"}
