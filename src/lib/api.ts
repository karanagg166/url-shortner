const isProd = process.env.NODE_ENV === "production";
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
const API_BASE_URL =
  configuredApiUrl && (!isProd || !configuredApiUrl.includes("localhost"))
    ? configuredApiUrl
    : typeof window !== "undefined"
      ? ""
      : "http://localhost:8000";

/**
 * Resolves the public short domain for short link display and copying.
 * Uses NEXT_PUBLIC_SHORT_DOMAIN or NEXT_PUBLIC_APP_URL if configured,
 * or falls back to current window origin (e.g. http://localhost:3000 in dev).
 */
export function getShortDomain(): string {
  const customDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || process.env.NEXT_PUBLIC_APP_URL;
  if (
    customDomain &&
    customDomain !== "https://" &&
    customDomain !== "http://" &&
    (!isProd || !customDomain.includes("localhost"))
  ) {
    return customDomain.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

/**
 * Formats a short code with the resolved domain (e.g. http://localhost:3000/YWJKbxC or https://yourdomain.com/YWJKbxC).
 */
export function formatShortUrl(shortCode: string, fallbackUrl?: string): string {
  if (!shortCode) return fallbackUrl || "";
  const domain = getShortDomain();
  return `${domain}/${shortCode}`;
}

export interface ShortenedUrl {
  id: string;
  user_id?: string | null;
  original_url: string;
  short_code: string;
  short_url: string;
  title?: string | null;
  clicks_count: number;
  qr_code_svg?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ShortenUrlPayload {
  original_url: string;
  title?: string;
  custom_slug?: string;
}

export interface SlugAvailability {
  available: boolean;
  slug: string;
  message: string;
  reason?: "already_taken" | "reserved" | "invalid_format" | null;
}

/**
 * Check if a custom alias/slug is available for shortening.
 */
export async function checkSlugAvailability(slug: string): Promise<SlugAvailability> {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) {
    return {
      available: false,
      slug: "",
      message: "Please enter an alias.",
      reason: "invalid_format",
    };
  }

  const response = await fetch(
    `${API_BASE_URL}/api/urls/check-availability?slug=${encodeURIComponent(trimmed)}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Failed to check slug availability" }));
    throw new Error(errorData.detail || "Failed to check slug availability");
  }

  return response.json();
}


/**
 * Call backend to convert original URL to a Base64-encoded short URL.
 */
export async function shortenUrl(
  payload: ShortenUrlPayload,
  accessToken?: string | null
): Promise<ShortenedUrl> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/urls`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Failed to shorten URL" }));
    throw new Error(errorData.detail || "Failed to shorten URL");
  }

  const data: ShortenedUrl = await response.json();
  return {
    ...data,
    short_url: formatShortUrl(data.short_code, data.short_url),
  };
}

/**
 * Fetch all shortened URLs created by the authenticated user.
 */
export async function getUserUrls(accessToken: string): Promise<ShortenedUrl[]> {
  const response = await fetch(`${API_BASE_URL}/api/urls`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Failed to fetch user URLs" }));
    throw new Error(errorData.detail || "Failed to fetch user URLs");
  }

  const data: ShortenedUrl[] = await response.json();
  return data.map((u) => ({
    ...u,
    short_url: formatShortUrl(u.short_code, u.short_url),
  }));
}

/**
 * Delete a user's shortened URL.
 */
export async function deleteUserUrl(
  urlId: string,
  accessToken: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/urls/${urlId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Failed to delete URL" }));
    throw new Error(errorData.detail || "Failed to delete URL");
  }

  return response.json();
}

export interface TimelineItem {
  date: string;
  clicks: number;
}

export interface CountryItem {
  country: string;
  clicks: number;
  percentage: number;
}

export interface CityItem {
  city: string;
  country: string;
  clicks: number;
}

export interface ReferrerItem {
  source: string;
  clicks: number;
  percentage: number;
}

export interface DeviceItem {
  device: string;
  clicks: number;
  percentage: number;
}

export interface BrowserItem {
  browser: string;
  clicks: number;
  percentage: number;
}

export interface OSItem {
  os: string;
  clicks: number;
  percentage: number;
}

export interface RecentClickItem {
  clicked_at: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  referrer?: string | null;
  referrer_domain?: string | null;
  device_type?: string | null;
  browser?: string | null;
  os?: string | null;
}

export interface UrlAnalytics {
  url_id: string;
  short_code: string;
  original_url: string;
  title?: string | null;
  total_clicks: number;
  unique_visitors: number;
  clicks_today: number;
  clicks_7d: number;
  clicks_30d: number;
  bot_clicks: number;
  last_clicked_at?: string | null;
  timeline: TimelineItem[];
  countries: CountryItem[];
  cities: CityItem[];
  referrers: ReferrerItem[];
  devices: DeviceItem[];
  browsers: BrowserItem[];
  operating_systems: OSItem[];
  recent_clicks: RecentClickItem[];
}

/**
 * Fetch detailed analytics for an owned shortened URL.
 */
export async function getUrlAnalytics(
  urlId: string,
  accessToken: string,
  range: string = "30d"
): Promise<UrlAnalytics> {
  const response = await fetch(
    `${API_BASE_URL}/api/urls/${urlId}/analytics?range=${encodeURIComponent(range)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: "Failed to fetch analytics" }));
    throw new Error(errorData.detail || "Failed to fetch analytics");
  }

  return response.json();
}

