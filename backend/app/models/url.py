from typing import Optional
from pydantic import BaseModel, Field


class UrlCreateRequest(BaseModel):
  original_url: str = Field(..., description="The original long URL to shorten")
  title: Optional[str] = Field(None, description="Optional custom title or label")
  custom_slug: Optional[str] = Field(None, description="Optional custom alias/slug")


class UrlResponse(BaseModel):
  id: str
  user_id: Optional[str] = None
  original_url: str
  short_code: str
  short_url: str
  title: Optional[str] = None
  clicks_count: int = 0
  qr_code_svg: Optional[str] = None
  is_active: bool = True
  created_at: Optional[str] = None
  updated_at: Optional[str] = None


class UrlStatsResponse(BaseModel):
  short_code: str
  original_url: str
  clicks_count: int
  is_active: bool
  created_at: Optional[str] = None


class SlugAvailabilityResponse(BaseModel):
  available: bool = Field(..., description="Whether the custom slug is available")
  slug: str = Field(..., description="The sanitized custom slug")
  message: str = Field(..., description="Human-readable status message")
  reason: Optional[str] = Field(None, description="Reason if unavailable: 'already_taken', 'reserved', or 'invalid_format'")

