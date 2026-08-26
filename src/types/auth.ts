import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  provider?: string | null;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export type OAuthProvider = "google" | "github";
