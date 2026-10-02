import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Determine true public origin (handling Vercel proxy, load balancers, and localhost)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocalEnv = process.env.NODE_ENV === "development";

  const redirectBase =
    !isLocalEnv && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : origin.includes("localhost") && !isLocalEnv && process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
        : origin;

  const targetPath = next.startsWith("/") ? next : `/${next}`;

  // Handle incoming OAuth provider errors
  if (error || errorDescription) {
    const errorMsg = errorDescription || error || "auth_failed";
    return NextResponse.redirect(
      `${redirectBase}/login?error=${encodeURIComponent(errorMsg)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data.user) {
      // Sync user profile to database table
      const user = data.user;
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User";

      try {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email,
            full_name: fullName,
            avatar_url: user.user_metadata?.avatar_url || null,
            provider: user.app_metadata?.provider || "oauth",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch (e) {
        console.error("Failed to sync profile in callback route:", e);
      }

      return NextResponse.redirect(`${redirectBase}${targetPath}`);
    }

    if (exchangeError) {
      return NextResponse.redirect(
        `${redirectBase}/login?error=${encodeURIComponent(exchangeError.message)}`
      );
    }
  }

  // If error or no code, redirect to login with error param
  return NextResponse.redirect(`${redirectBase}/login?error=auth_failed`);
}
