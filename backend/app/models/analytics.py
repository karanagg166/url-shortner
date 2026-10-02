from typing import List, Optional
from pydantic import BaseModel, Field


class TimelineItem(BaseModel):
  date: str
  clicks: int


class CountryItem(BaseModel):
  country: str
  clicks: int
  percentage: float = 0.0


class CityItem(BaseModel):
  city: str
  country: str
  clicks: int


class ReferrerItem(BaseModel):
  source: str
  clicks: int
  percentage: float = 0.0


class DeviceItem(BaseModel):
  device: str
  clicks: int
  percentage: float = 0.0


class BrowserItem(BaseModel):
  browser: str
  clicks: int
  percentage: float = 0.0


class OSItem(BaseModel):
  os: str
  clicks: int
  percentage: float = 0.0


class RecentClickItem(BaseModel):
  clicked_at: str
  country: Optional[str] = None
  region: Optional[str] = None
  city: Optional[str] = None
  referrer: Optional[str] = None
  referrer_domain: Optional[str] = None
  device_type: Optional[str] = None
  browser: Optional[str] = None
  os: Optional[str] = None


class UrlAnalyticsResponse(BaseModel):
  url_id: str
  short_code: str
  original_url: str
  title: Optional[str] = None
  total_clicks: int = 0
  unique_visitors: int = 0
  clicks_today: int = 0
  clicks_7d: int = 0
  clicks_30d: int = 0
  bot_clicks: int = 0
  last_clicked_at: Optional[str] = None
  timeline: List[TimelineItem] = Field(default_factory=list)
  countries: List[CountryItem] = Field(default_factory=list)
  cities: List[CityItem] = Field(default_factory=list)
  referrers: List[ReferrerItem] = Field(default_factory=list)
  devices: List[DeviceItem] = Field(default_factory=list)
  browsers: List[BrowserItem] = Field(default_factory=list)
  operating_systems: List[OSItem] = Field(default_factory=list)
  recent_clicks: List[RecentClickItem] = Field(default_factory=list)
