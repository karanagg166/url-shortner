"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Link2,
  LogOut,
  User,
  Mail,
  Shield,
  Clock,
  Sparkles,
  BarChart3,
  QrCode,
  ExternalLink,
  Plus,
  Loader2,
  CheckCircle2,
  Database,
  Copy,
  Check,
  Trash2,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { getUserUrls, shortenUrl, deleteUserUrl, type ShortenedUrl } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, session, isLoading: isAuthLoading, logout } = useAuth();

  // Links state
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [isFetchingUrls, setIsFetchingUrls] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // New URL Form state
  const [longUrl, setLongUrl] = useState("");
  const [title, setTitle] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<ShortenedUrl | null>(null);

  // Action state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch URLs for current logged-in user
  const loadUserUrls = useCallback(async () => {
    if (!session?.access_token) return;
    setIsFetchingUrls(true);
    setFetchError(null);
    try {
      const data = await getUserUrls(session.access_token);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const normalized = data.map((u) => ({
        ...u,
        short_url: origin ? `${origin}/${u.short_code}` : u.short_url,
      }));
      setUrls(normalized);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : "Failed to load your shortened URLs");
    } finally {
      setIsFetchingUrls(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (session?.access_token) {
      loadUserUrls();
    }
  }, [session?.access_token, loadUserUrls]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  const handleCreateShortUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const trimmed = longUrl.trim();
    if (!trimmed) {
      setFormError("Please enter a valid URL to shorten.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newLink = await shortenUrl(
        {
          original_url: trimmed,
          title: title.trim() || undefined,
          custom_slug: customSlug.trim() || undefined,
        },
        session?.access_token
      );

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const displayUrl = origin ? `${origin}/${newLink.short_code}` : newLink.short_url;
      const normalizedLink = { ...newLink, short_url: displayUrl };

      setFormSuccess(normalizedLink);
      setUrls((prev) => [normalizedLink, ...prev.filter((u) => u.id !== newLink.id)]);
      setLongUrl("");
      setTitle("");
      setCustomSlug("");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to shorten URL");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (urlId: string) => {
    if (!session?.access_token) return;
    if (!confirm("Are you sure you want to delete this shortened URL?")) return;

    setDeletingId(urlId);
    try {
      await deleteUserUrl(urlId, session.access_token);
      setUrls((prev) => prev.filter((u) => u.id !== urlId));
      if (formSuccess?.id === urlId) {
        setFormSuccess(null);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete URL");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = (code: string, text: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let cleanUrl = text;
    if (origin && cleanUrl.includes("localhost:8000")) {
      cleanUrl = cleanUrl.replace("http://localhost:8000", origin);
    }
    navigator.clipboard.writeText(cleanUrl);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-zinc-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const userEmail = profile?.email || user?.email || "user@example.com";
  const userProvider = profile?.provider || user?.app_metadata?.provider || "email";

  // Calculate live statistics
  const totalLinks = urls.length;
  const totalClicks = urls.reduce((acc, curr) => acc + (curr.clicks_count || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Link2 className="w-4.5 h-4.5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
              ShortLink
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Landing Page
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Base64 URL Encoding & Redis Cache Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome, {displayName}!
              </h1>
              <p className="text-blue-100 text-sm mt-1 max-w-xl">
                Upload your long URLs to convert them into fast Base64 shortened links with sub-5ms Redis caching and temporary (307) redirection.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="#create-link"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-md hover:bg-blue-50 transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Shorten New URL</span>
              </a>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Your Short Links
              </p>
              <p className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">
                {totalLinks}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Link2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Total Live Clicks
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {totalClicks}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Database Index Status
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  idx_urls_user_id Active
                </p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* URL Shortener Form Card */}
        <div
          id="create-link"
          className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6"
        >
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>Shorten a URL (Base64 Mapped)</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Upload your link. The backend encodes a unique Base64 short code, indexes it under your user ID, and caches it in Redis.
            </p>
          </div>

          {formError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>URL Shortened Successfully via Base64!</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono break-all">
                  {formSuccess.short_url}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(formSuccess.short_code, formSuccess.short_url)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedCode === formSuccess.short_code ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Short Link</span>
                    </>
                  )}
                </button>
                <a
                  href={formSuccess.short_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <span>Test 307 Redirect</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateShortUrl} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Target Destination URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/your-very-long-url-path"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Optional Title / Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. GitHub Repository"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
              <div className="sm:max-w-xs w-full space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Custom Slug (optional, leave blank for Base64 auto)
                </label>
                <input
                  type="text"
                  placeholder="e.g. my-campaign"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  className="w-full px-4 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition cursor-pointer self-end"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Short URL...</span>
                  </>
                ) : (
                  <>
                    <span>Shorten URL</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* User Shortened URLs List */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>Your Shortened Links (Indexed by user_id)</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Fetched via backend endpoint <code className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-blue-600">GET /api/urls</code> using your session token.
              </p>
            </div>

            <button
              type="button"
              onClick={loadUserUrls}
              disabled={isFetchingUrls}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              {isFetchingUrls ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Refresh Links</span>
            </button>
          </div>

          {fetchError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs">
              {fetchError}
            </div>
          )}

          {isFetchingUrls && urls.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs text-zinc-500">Querying database via user_id index...</p>
            </div>
          ) : urls.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                <Link2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No shortened URLs found yet
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Upload your first long URL using the form above to generate a Base64 shortened link.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {urls.map((item) => (
                <div
                  key={item.id}
                  className="py-4.5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 -mx-4 px-4 rounded-2xl transition"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        <a href={item.short_url} target="_blank" rel="noopener noreferrer">
                          /{item.short_code}
                        </a>
                      </span>
                      {item.title && (
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          — {item.title}
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        HTTP 301 Permanent Redirect
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-lg">
                      {item.original_url}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                        <TrendingUp className="w-3 h-3" />
                        {item.clicks_count} {item.clicks_count === 1 ? "click" : "clicks"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.short_code, item.short_url)}
                      className="px-3 py-1.5 text-xs font-medium rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedCode === item.short_code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <a
                      href={item.short_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition"
                      title="Open and test temporary redirect"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/60 text-zinc-400 hover:text-red-600 transition cursor-pointer"
                      title="Delete link"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
