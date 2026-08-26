from typing import Optional
import strawberry


@strawberry.type
class UrlType:
  id: str
  user_id: Optional[str] = None
  original_url: str
  short_code: str
  short_url: str
  title: Optional[str] = None
  clicks_count: int = 0
  is_active: bool = True
  created_at: Optional[str] = None
  updated_at: Optional[str] = None
