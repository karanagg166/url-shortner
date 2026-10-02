"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithOAuth,
  signOutUser,
  getCurrentUserProfile,
} from "@/lib/auth";
import type {
  UserProfile,
  SignUpParams,
  SignInParams,
  OAuthProvider,
} from "@/types/auth";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      const p = await getCurrentUserProfile(currentUser.id);
      if (p) {
        setProfile(p);
      } else {
        // Fallback to metadata
        setProfile({
          id: currentUser.id,
          email: currentUser.email || "",
          full_name:
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            null,
          avatar_url: currentUser.user_metadata?.avatar_url || null,
          provider: currentUser.app_metadata?.provider || "email",
        });
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Get current session
    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            await fetchProfile(currentSession.user);
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Auth initialization error");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, newSession: Session | null) => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user) {
            await fetchProfile(newSession.user);
          } else {
            setProfile(null);
          }
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (params: SignUpParams) => {
    setError(null);
    setIsLoading(true);
    const res = await signUpWithEmail(params);
    if (res.error) {
      setError(res.error.message);
      setIsLoading(false);
      return { data: null, error: res.error };
    }
    setIsLoading(false);
    return res;
  };

  const signIn = async (params: SignInParams) => {
    setError(null);
    setIsLoading(true);
    const res = await signInWithEmail(params);
    if (res.error) {
      setError(res.error.message);
      setIsLoading(false);
      return { data: null, error: res.error };
    }
    setIsLoading(false);
    return res;
  };

  const loginWithOAuth = async (provider: OAuthProvider) => {
    setError(null);
    setIsLoading(true);
    const res = await signInWithOAuth(provider);
    if (res.error) {
      setError(res.error.message);
      setIsLoading(false);
      return { data: null, error: res.error };
    }
    return res;
  };

  const logout = async () => {
    setError(null);
    setIsLoading(true);
    const res = await signOutUser();
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsLoading(false);
    return res;
  };

  return {
    user,
    profile,
    session,
    isAuthenticated: !!user,
    isLoading,
    error,
    signUp,
    signIn,
    loginWithOAuth,
    logout,
    refreshProfile: () => user && fetchProfile(user),
  };
}
