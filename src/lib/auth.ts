import { supabase } from "@/lib/supabase/client";
import type {
  SignUpParams,
  SignInParams,
  OAuthProvider,
  UserProfile,
} from "@/types/auth";

/**
 * Synchronize or create user profile record in the database (`profiles` / `users` table)
 */
export async function syncUserProfile(
  userId: string,
  data: {
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    provider?: string | null;
  }
): Promise<{ data: UserProfile | null; error: Error | null }> {
  try {
    const profilePayload = {
      id: userId,
      email: data.email,
      full_name: data.full_name || null,
      avatar_url: data.avatar_url || null,
      provider: data.provider || "email",
      updated_at: new Date().toISOString(),
    };

    // Try upserting to 'profiles' table
    const { data: profile, error } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.warn("Profiles table sync notice:", error.message);
      // Fallback object if table creation is pending
      return {
        data: {
          id: userId,
          email: data.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          provider: data.provider || "email",
        },
        error: null,
      };
    }

    return { data: profile as UserProfile, error: null };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Failed to sync user profile");
    return { data: null, error };
  }
}

/**
 * Sign up a new user with email and password, storing full name in auth metadata & database
 */
export async function signUpWithEmail({
  email,
  password,
  fullName,
}: SignUpParams) {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) throw error;

    // If user object returned, sync to database table
    if (data.user) {
      await syncUserProfile(data.user.id, {
        email: data.user.email || email,
        full_name: fullName,
        provider: "email",
      });
    }

    return { data, error: null };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Sign up failed");
    return { data: null, error };
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signInWithEmail({ email, password }: SignInParams) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Sync profile on login if user exists
    if (data.user) {
      const fullName =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        null;

      await syncUserProfile(data.user.id, {
        email: data.user.email || email,
        full_name: fullName,
        provider: data.user.app_metadata?.provider || "email",
      });
    }

    return { data, error: null };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Sign in failed");
    return { data: null, error };
  }
}

/**
 * Sign in with third-party OAuth provider (Google or GitHub)
 */
export async function signInWithOAuth(provider: OAuthProvider) {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("OAuth sign in failed");
    return { data: null, error };
  }
}

/**
 * Sign out the currently authenticated user
 */
export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Sign out failed");
    return { error };
  }
}

/**
 * Fetch the current user profile from the database
 */
export async function getCurrentUserProfile(
  userId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) return null;
    return data as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Get current session and user
 */
export async function getSession() {
  return await supabase.auth.getSession();
}
