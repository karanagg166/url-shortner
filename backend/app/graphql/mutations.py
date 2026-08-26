from typing import Optional
import strawberry
from app.core.auth import get_optional_user
from app.graphql.types import UrlType
from app.models.url import UrlCreateRequest
from app.services.url_service import UrlService


@strawberry.type
class Mutation:

  @strawberry.mutation
  async def shorten_url(
      self,
      info: strawberry.types.Info,
      original_url: str,
      title: Optional[str] = None,
      custom_slug: Optional[str] = None,
  ) -> UrlType:
    request = info.context.get("request")
    user = await get_optional_user(request)
    user_id = user.id if user else None

    base_url = str(request.base_url).rstrip("/")
    req = UrlCreateRequest(
        original_url=original_url, title=title, custom_slug=custom_slug
    )
    result = await UrlService.shorten_url(
        request=req, user_id=user_id, base_url=base_url
    )

    return UrlType(
        id=result.id,
        user_id=result.user_id,
        original_url=result.original_url,
        short_code=result.short_code,
        short_url=result.short_url,
        title=result.title,
        clicks_count=result.clicks_count,
        is_active=result.is_active,
        created_at=result.created_at,
        updated_at=result.updated_at,
    )
