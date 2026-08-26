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

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${backendUrl.replace(/\/$/, "")}/${encodeURIComponent(shortCode)}`, {
      method: "GET",
      redirect: "manual",
    });

    const location = res.headers.get("location");
    if (location) {
      return NextResponse.redirect(location, 307);
    }
  } catch (err) {
    console.error("Short code redirection error:", err);
  }

  return NextResponse.redirect(new URL("/not-found", request.url));
}
