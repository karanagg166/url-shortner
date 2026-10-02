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

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isProd = process.env.NODE_ENV === "production";
  const publicOrigin =
    isProd && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : request.nextUrl.origin;

  const backendBase = (
    process.env.INTERNAL_API_URL ||
    (isProd && !publicOrigin.includes("localhost")
      ? publicOrigin
      : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  ).replace(/\/$/, "");

  try {
    const forwardHeaders: Record<string, string> = {};
    const userAgent = request.headers.get("user-agent");
    if (userAgent) forwardHeaders["user-agent"] = userAgent;

    const referer = request.headers.get("referer") || request.headers.get("referrer");
    if (referer) forwardHeaders["referer"] = referer;

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp;
    if (clientIp) forwardHeaders["x-forwarded-for"] = clientIp;

    const country = request.headers.get("x-vercel-ip-country");
    if (country) forwardHeaders["x-vercel-ip-country"] = country;

    const region = request.headers.get("x-vercel-ip-country-region");
    if (region) forwardHeaders["x-vercel-ip-country-region"] = region;

    const city = request.headers.get("x-vercel-ip-city");
    if (city) forwardHeaders["x-vercel-ip-city"] = city;

    const res = await fetch(
      `${backendBase}/api/urls/resolve/${encodeURIComponent(shortCode)}`,
      {
        method: "GET",
        headers: forwardHeaders,
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

      const response = NextResponse.redirect(location, 302);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
  } catch (err) {
    console.error("Short code redirection error:", err);
  }

  return NextResponse.redirect(new URL("/not-found", publicOrigin));
}
