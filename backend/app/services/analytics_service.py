import hashlib
import logging
import os
import re
from typing import Any, Dict, Optional, Tuple
from urllib.parse import unquote, urlparse

from app.core.supabase import get_supabase
from app.models.analytics import (
    BrowserItem,
    CityItem,
    CountryItem,
    DeviceItem,
    OSItem,
    RecentClickItem,
    ReferrerItem,
    TimelineItem,
    UrlAnalyticsResponse,
)
from fastapi import Request

logger = logging.getLogger(__name__)

# ISO-3166-1 alpha-2 code to common English name mapping
ISO_COUNTRIES: Dict[str, str] = {
    "IN": "India",
    "US": "United States",
    "GB": "United Kingdom",
    "DE": "Germany",
    "CA": "Canada",
    "AU": "Australia",
    "FR": "France",
    "BR": "Brazil",
    "JP": "Japan",
    "SG": "Singapore",
    "NL": "Netherlands",
    "ES": "Spain",
    "IT": "Italy",
    "RU": "Russia",
    "CN": "China",
    "KR": "South Korea",
    "ID": "Indonesia",
    "MX": "Mexico",
    "ZA": "South Africa",
    "AE": "United Arab Emirates",
    "SE": "Sweden",
    "CH": "Switzerland",
    "PL": "Poland",
    "TR": "Turkey",
    "IE": "Ireland",
    "NZ": "New Zealand",
    "PK": "Pakistan",
    "BD": "Bangladesh",
    "VN": "Vietnam",
    "PH": "Philippines",
    "TH": "Thailand",
    "MY": "Malaysia",
    "NG": "Nigeria",
    "EG": "Egypt",
    "AR": "Argentina",
    "CO": "Colombia",
    "CL": "Chile",
    "IL": "Israel",
    "SA": "Saudi Arabia",
    "AT": "Austria",
    "BE": "Belgium",
    "DK": "Denmark",
    "FI": "Finland",
    "NO": "Norway",
    "PT": "Portugal",
    "GR": "Greece",
    "CZ": "Czech Republic",
    "RO": "Romania",
    "HU": "Hungary",
    "UA": "Ukraine",
    "HK": "Hong Kong",
    "TW": "Taiwan",
}

BOT_REGEX = re.compile(
    r"(bot|crawler|spider|slurp|facebookexternalhit|whatsapp|twitterbot|pinterest|"
    r"googlebot|bingbot|yahoo|duckduckbot|yandex|baidu|curl|wget|python-requests|"
    r"aiohttp|httpx|postman|insomnia|headlesschrome|phantomjs)",
    re.IGNORECASE,
)


class AnalyticsService:

  @staticmethod
  def parse_user_agent(ua_str: str) -> Tuple[str, str, str]:
    """Parse User-Agent string to extract (device_type, browser, os).

    Devices: Desktop, Mobile, Tablet, Bot, Unknown
    Browsers: Chrome, Safari, Firefox, Edge, Opera, Other
    OS: Windows, macOS, Linux, Android, iOS, Other
    """
    if not ua_str:
      return ("Unknown", "Other", "Other")

    ua_lower = ua_str.lower()

    # 1. Bot check
    if BOT_REGEX.search(ua_lower):
      return ("Bot", "Bot", "Other")

    # 2. OS detection
    os_name = "Other"
    if "windows" in ua_lower:
      os_name = "Windows"
    elif any(x in ua_lower for x in ("iphone", "ipad", "ipod", "cpu iphone os")):
      os_name = "iOS"
    elif "macintosh" in ua_lower or "mac os x" in ua_lower:
      os_name = "macOS"
    elif "android" in ua_lower:
      os_name = "Android"
    elif "linux" in ua_lower or "x11" in ua_lower:
      os_name = "Linux"

    # 3. Device detection
    device_type = "Desktop"
    if any(x in ua_lower for x in ("ipad", "tablet", "playbook", "silk")):
      device_type = "Tablet"
    elif any(
        x in ua_lower
        for x in (
            "mobile",
            "iphone",
            "ipod",
            "blackberry",
            "iemobile",
            "opera mini",
        )
    ):
      device_type = "Mobile"
    elif "android" in ua_lower:
      device_type = "Mobile" if "mobile" in ua_lower else "Tablet"

    # 4. Browser detection
    browser = "Other"
    if "edg/" in ua_lower or "edge/" in ua_lower:
      browser = "Edge"
    elif "opr/" in ua_lower or "opera/" in ua_lower:
      browser = "Opera"
    elif "chrome/" in ua_lower or "crios/" in ua_lower:
      browser = "Chrome"
    elif "firefox/" in ua_lower or "fxios/" in ua_lower:
      browser = "Firefox"
    elif "safari/" in ua_lower and not any(
        x in ua_lower for x in ("chrome/", "crios/", "android")
    ):
      browser = "Safari"

    return (device_type, browser, os_name)

  @classmethod
  def extract_client_info(cls, request: Request) -> Dict[str, Any]:
    """Extract metadata from request while protecting visitor privacy.

    RAW IP IS NEVER STORED OR RETURNED!
    """
    headers = request.headers

    # Extract client IP for hashing purposes only
    forwarded_for = headers.get("x-forwarded-for")
    real_ip = headers.get("x-real-ip")
    if forwarded_for:
      client_ip = forwarded_for.split(",")[0].strip()
    elif real_ip:
      client_ip = real_ip.strip()
    elif request.client and request.client.host:
      client_ip = request.client.host.strip()
    else:
      client_ip = "127.0.0.1"

    user_agent = headers.get("user-agent", "").strip()

    # Cryptographic visitor hash with server salt (SHA-256)
    salt = (
        os.getenv("ANALYTICS_HASH_SECRET")
        or os.getenv("SUPABASE_SECRET_KEY")
        or "shortlink-analytics-pepper-salt-2026"
    )
    raw_hash_data = f"{client_ip}:{user_agent}:{salt}".encode("utf-8")
    visitor_hash = hashlib.sha256(raw_hash_data).hexdigest()

    # Geo extraction from Vercel headers
    raw_country = (headers.get("x-vercel-ip-country") or "").strip().upper()
    country = ISO_COUNTRIES.get(raw_country, raw_country) if raw_country else None

    raw_region = headers.get("x-vercel-ip-country-region")
    region = raw_region.strip() if raw_region else None

    raw_city = headers.get("x-vercel-ip-city")
    city = unquote(raw_city.strip()) if raw_city else None

    # Referrer normalization
    referer = headers.get("referer", "").strip()
    referrer_domain = "Direct"
    normalized_referrer = None

    if referer:
      try:
        parsed = urlparse(referer)
        if parsed.netloc:
          domain = parsed.netloc.lower().split(":")[0]
          if domain.startswith("www."):
            domain = domain[4:]
          referrer_domain = domain if domain else "Direct"
          normalized_referrer = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
      except Exception:
        referrer_domain = "Direct"

    # User-agent parsing
    device_type, browser, os_name = cls.parse_user_agent(user_agent)

    return {
        "visitor_hash": visitor_hash,
        "country": country,
        "region": region,
        "city": city,
        "referrer": normalized_referrer,
        "referrer_domain": referrer_domain,
        "user_agent": user_agent[:500] if user_agent else None,
        "device_type": device_type,
        "browser": browser,
        "os": os_name,
    }

  @classmethod
  async def record_click_event(
      cls,
      short_code: str,
      url_id: str,
      request: Request,
  ) -> None:
    """Record a click event in Supabase asynchronously.

    Failures MUST NEVER disrupt URL redirection.
    """
    try:
      client_info = cls.extract_client_info(request)
      supabase = get_supabase()
      if not supabase:
        return

      payload = {
          "url_id": url_id,
          "short_code": short_code,
          "visitor_hash": client_info["visitor_hash"],
          "country": client_info["country"],
          "region": client_info["region"],
          "city": client_info["city"],
          "referrer": client_info["referrer"],
          "referrer_domain": client_info["referrer_domain"],
          "user_agent": client_info["user_agent"],
          "device_type": client_info["device_type"],
          "browser": client_info["browser"],
          "os": client_info["os"],
      }
      supabase.table("click_events").insert(payload).execute()
    except Exception as e:
      logger.warning(f"Non-blocking: Failed to insert click event for {short_code}: {e}")

  @classmethod
  async def get_url_analytics(
      cls,
      url_record: Dict[str, Any],
      time_range: str = "30d",
  ) -> UrlAnalyticsResponse:
    """Aggregate metrics and breakdown for an owned short URL."""
    url_id = url_record["id"]
    supabase = get_supabase()

    # 1. Try PostgreSQL Stored Procedure (fastest sub-5ms aggregation)
    if supabase:
      try:
        rpc_result = supabase.rpc(
            "get_url_analytics",
            {"p_url_id": url_id, "p_range": time_range},
        ).execute()

        if rpc_result and rpc_result.data:
          data = rpc_result.data
          # Parse into UrlAnalyticsResponse
          return UrlAnalyticsResponse(
              url_id=url_id,
              short_code=url_record["short_code"],
              original_url=url_record["original_url"],
              title=url_record.get("title"),
              total_clicks=max(data.get("total_clicks", 0), url_record.get("clicks_count", 0)),
              unique_visitors=data.get("unique_visitors", 0),
              clicks_today=data.get("clicks_today", 0),
              clicks_7d=data.get("clicks_7d", 0),
              clicks_30d=data.get("clicks_30d", 0),
              bot_clicks=data.get("bot_clicks", 0),
              last_clicked_at=data.get("last_clicked_at"),
              timeline=[TimelineItem(**item) for item in data.get("timeline", [])],
              countries=[CountryItem(**item) for item in data.get("countries", [])],
              cities=[CityItem(**item) for item in data.get("cities", [])],
              referrers=[ReferrerItem(**item) for item in data.get("referrers", [])],
              devices=[DeviceItem(**item) for item in data.get("devices", [])],
              browsers=[BrowserItem(**item) for item in data.get("browsers", [])],
              operating_systems=[OSItem(**item) for item in data.get("operating_systems", [])],
              recent_clicks=[RecentClickItem(**item) for item in data.get("recent_clicks", [])],
          )
      except Exception as rpc_err:
        logger.warning(f"get_url_analytics RPC fallback: {rpc_err}")

    # 2. Resilient fallback if RPC is ever unreachable
    return cls._build_fallback_analytics(url_record)

  @classmethod
  def _build_fallback_analytics(
      cls,
      url_record: Dict[str, Any],
  ) -> UrlAnalyticsResponse:
    """Fallback response using URL row data when analytics DB is empty/unreachable."""
    clicks = url_record.get("clicks_count", 0)
    return UrlAnalyticsResponse(
        url_id=url_record["id"],
        short_code=url_record["short_code"],
        original_url=url_record["original_url"],
        title=url_record.get("title"),
        total_clicks=clicks,
        unique_visitors=min(clicks, 1) if clicks > 0 else 0,
        clicks_today=0,
        clicks_7d=clicks,
        clicks_30d=clicks,
        bot_clicks=0,
        last_clicked_at=url_record.get("updated_at"),
        timeline=[],
        countries=[],
        cities=[],
        referrers=[],
        devices=[],
        browsers=[],
        operating_systems=[],
        recent_clicks=[],
    )
