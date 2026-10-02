import { NextRequest, NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";

const RESERVED_PATHS = new Set([
  "api",
  "auth",
  "dashboard",
  "login",
  "register",
  "not-found",
  "docs",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_next",
]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await context.params;

  if (!shortCode || RESERVED_PATHS.has(shortCode.toLowerCase())) {
    return NextResponse.next();
  }

  const origin = request.nextUrl.origin;
  const isProd = process.env.NODE_ENV === "production";
  const backendBase = (
    process.env.INTERNAL_API_URL ||
    (isProd && !origin.includes("localhost")
      ? origin
      : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  ).replace(/\/$/, "");

  try {
    const res = await fetch(
      `${backendBase}/api/urls/resolve/${encodeURIComponent(shortCode)}`,
      {
        method: "GET",
        redirect: "manual",
      }
    );

    const location = res.headers.get("location");
    if (location) {
      // Track short URL visit/redirect event in Vercel Web Analytics
      try {
        await track("short_url_redirected", {
          short_code: shortCode,
        });
      } catch {
        // Analytics failure should never block redirect
      }

      const response = NextResponse.redirect(location, 301);
      response.headers.set(
        "Cache-Control",
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600"
      );
      return response;
    }
  } catch (err) {
    console.error("Short code redirection error:", err);
  }

  return NextResponse.redirect(new URL("/not-found", request.url));
}
