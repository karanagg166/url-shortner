from typing import List, Optional
import strawberry
from app.core.auth import get_optional_user
from app.graphql.types import UrlType
from app.services.url_service import UrlService


@strawberry.type
class Query:

  @strawberry.field
  def hello(self) -> str:
    return "URL Shortener GraphQL API Online"

  @strawberry.field
  async def my_urls(self, info: strawberry.types.Info) -> List[UrlType]:
    request = info.context.get("request")
    user = await get_optional_user(request)
    if not user:
      return []

    base_url = str(request.base_url).rstrip("/")
    results = await UrlService.get_user_urls(user_id=user.id, base_url=base_url)
    return [
        UrlType(
            id=u.id,
            user_id=u.user_id,
            original_url=u.original_url,
            short_code=u.short_code,
            short_url=u.short_url,
            title=u.title,
            clicks_count=u.clicks_count,
            is_active=u.is_active,
            created_at=u.created_at,
            updated_at=u.updated_at,
        )
        for u in results
    ]
