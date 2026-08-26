import { NextRequest, NextResponse } from "next/server";

const RESERVED_PATHS = new Set([
  "api",
  "auth",
  "dashboard",
  "login",
  "register",
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
  const backendBase = (
    process.env.INTERNAL_API_URL ||
    (process.env.NODE_ENV !== "production" ? "http://backend:8000" : origin)
  ).replace(/\/$/, "");

  try {
    const res = await fetch(`${backendBase}/api/urls/resolve/${encodeURIComponent(shortCode)}`, {
      method: "GET",
      redirect: "manual",
    });

    const location = res.headers.get("location");
    if (location) {
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
