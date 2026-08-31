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
  if (customDomain && customDomain !== "https://" && customDomain !== "http://") {
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
