"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const { signIn, loginWithOAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    searchParams.get("error") === "auth_failed"
      ? "Authentication session expired or failed. Please sign in again."
      : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn({ email: email.trim(), password });

      if (res.error) {
        setErrorMessage(
          res.error.message || "Invalid email or password. Please try again."
        );
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Signed in successfully. Redirecting...");
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "github" | "google") => {
    setErrorMessage(null);
    setOauthLoading(provider);

    try {
      const res = await loginWithOAuth(provider);
      if (res.error) {
        setErrorMessage(res.error.message);
        setOauthLoading(null);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "OAuth login failed."
      );
      setOauthLoading(null);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs transition-colors">
      {/* OAuth Social Buttons */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <button
          type="button"
          disabled={!!oauthLoading || isLoading}
          onClick={() => handleOAuthLogin("github")}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-60 cursor-pointer"
        >
          {oauthLoading === "github" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
          ) : (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          )}
          <span>GitHub</span>
        </button>

        <button
          type="button"
          disabled={!!oauthLoading || isLoading}
          onClick={() => handleOAuthLogin("google")}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-60 cursor-pointer"
        >
          {oauthLoading === "google" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.54 0 2.92.53 4.02 1.57l3.01-3.01C17.21 1.8 14.79 1 12 1 7.54 1 3.73 3.56 1.88 7.31l3.66 2.84C6.41 7.21 8.97 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.86c2.16-1.99 3.41-4.92 3.41-8.68z"
              />
              <path
                fill="#FBBC05"
                d="M5.54 14.85c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.88 7.31C1.09 8.89.64 10.65.64 12.5s.45 3.61 1.24 5.19l3.66-2.84z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.69-2.86c-1.07.72-2.45 1.15-4.24 1.15-3.03 0-5.59-2.21-6.46-5.15L1.88 17.07C3.73 20.82 7.54 23.38 12 23.38z"
              />
            </svg>
          )}
          <span>Google</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        <span className="bg-white dark:bg-zinc-900 px-2 text-[10px] uppercase tracking-wider text-zinc-400 absolute">
          or with email
        </span>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs sm:text-sm placeholder:text-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs sm:text-sm placeholder:text-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
            />
            <span className="text-zinc-600 dark:text-zinc-400">Remember me</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading || !!oauthLoading}
          className="w-full py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-medium rounded-lg transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>
    </div>
  );
}
