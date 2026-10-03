"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { useAuth } from "@/hooks/useAuth";
import {
  Link2,
  LogOut,
  BarChart3,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import {
  getUserUrls,
  shortenUrl,
  deleteUserUrl,
  formatShortUrl,
  getShortDomain,
  checkSlugAvailability,
  type ShortenedUrl,
  type SlugAvailability,
} from "@/lib/api";

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
  const [showOptions, setShowOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<ShortenedUrl | null>(null);

  // Custom slug availability state
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<SlugAvailability | null>(null);

  // Debounced real-time custom mapping availability checker
  useEffect(() => {
    const raw = customSlug.trim();
    if (!raw) {
      const timer = setTimeout(() => {
        setSlugAvailability(null);
        setSlugChecking(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const clean = raw.toLowerCase();
    if (clean.length < 2) {
      const timer = setTimeout(() => {
        setSlugAvailability({
          available: false,
          slug: clean,
          message: "Alias must be at least 2 characters.",
          reason: "invalid_format",
        });
        setSlugChecking(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    if (!/^[a-z0-9-_]+$/.test(clean)) {
      const timer = setTimeout(() => {
        setSlugAvailability({
          available: false,
          slug: clean,
          message: "Only letters, numbers, hyphens (-), and underscores (_) are allowed.",
          reason: "invalid_format",
        });
        setSlugChecking(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const res = await checkSlugAvailability(clean);
        setSlugAvailability(res);
      } catch {
        setSlugAvailability({
          available: false,
          slug: clean,
          message: "Could not verify alias availability.",
        });
      } finally {
        setSlugChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customSlug]);


  // Action state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch URLs for current logged-in user
  const loadUserUrls = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return;
    setIsFetchingUrls(true);
    setFetchError(null);
    try {
      const data = await getUserUrls(token);
      const normalized = data.map((u) => ({
        ...u,
        short_url: formatShortUrl(u.short_code, u.short_url),
      }));
      setUrls(normalized);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : "Failed to load links");
    } finally {
      setIsFetchingUrls(false);
    }
  }, [session]);

  useEffect(() => {
    let ignore = false;
    const token = session?.access_token;
    if (token) {
      getUserUrls(token)
        .then((data) => {
          if (!ignore) {
            setUrls(
              data.map((u) => ({
                ...u,
                short_url: formatShortUrl(u.short_code, u.short_url),
              }))
            );
          }
        })
        .catch((err: unknown) => {
          if (!ignore) {
            setFetchError(err instanceof Error ? err.message : "Failed to load links");
          }
        });
    }
    return () => {
      ignore = true;
    };
  }, [session]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  const handleCreateShortUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    let trimmed = longUrl.trim();
    if (!trimmed) {
      setFormError("Please enter a valid destination URL.");
      return;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      trimmed = "https://" + trimmed;
    }

    try {
      new URL(trimmed);
    } catch {
      setFormError("Please enter a valid URL (e.g. https://example.com).");
      return;
    }

    const customTrimmed = customSlug.trim();
    if (customTrimmed) {
      if (slugChecking) {
        setFormError("Checking custom alias availability... please wait.");
        return;
      }
      if (slugAvailability && !slugAvailability.available) {
        setFormError(slugAvailability.message || "The chosen custom alias is not available.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const hasCustomSlug = Boolean(customTrimmed);
      const newLink = await shortenUrl(
        {
          original_url: trimmed,
          title: title.trim() || undefined,
          custom_slug: customTrimmed || undefined,
        },
        session?.access_token
      );

      const displayUrl = formatShortUrl(newLink.short_code, newLink.short_url);
      const normalizedLink = { ...newLink, short_url: displayUrl };

      setFormSuccess(normalizedLink);
      setUrls((prev) => [normalizedLink, ...prev.filter((u) => u.id !== newLink.id)]);
      setLongUrl("");
      setTitle("");
      setCustomSlug("");
      setSlugAvailability(null);
      setShowOptions(false);

      try {
        track("url_shortened", {
          has_custom_slug: hasCustomSlug,
          is_authenticated: true,
        });
      } catch {
        // Safe fallback
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to shorten URL");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (urlId: string) => {
    if (!session?.access_token) return;
    if (!window.confirm("Are you sure you want to delete this short link?")) return;

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
    navigator.clipboard.writeText(text);
    setCopiedCode(code);

    try {
      track("short_url_copied");
    } catch {
      // Safe fallback
    }

    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading dashboard...</span>
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

  const totalLinks = urls.length;
  const totalClicks = urls.reduce((acc, curr) => acc + (curr.clicks_count || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100 text-sm"
            >
              <div className="w-6 h-6 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
                <Link2 className="w-3.5 h-3.5" />
              </div>
              <span>ShortLink</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Shortener
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Overview
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Logged in as {displayName} ({user?.email})
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Links</p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-white mt-0.5">
                {totalLinks}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Clicks</p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-white mt-0.5">
                {totalClicks}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Create Link Card */}
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Create New Short Link
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Enter a destination URL to generate a shortened redirect link.
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-red-600 dark:text-red-400 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Link Created</span>
                </div>
                <p className="font-mono font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {formSuccess.short_url}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(formSuccess.short_code, formSuccess.short_url)}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedCode === formSuccess.short_code ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
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
                  href={formSuccess.short_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1 transition"
                >
                  <span>Visit</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateShortUrl} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Destination URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/long-page-path"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Docs, Launch Page"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showOptions ? "Hide custom alias" : "Custom alias (optional)"}</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-medium transition disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Link</span>
                )}
              </button>
            </div>

            {showOptions && (
              <div className="pt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="dash-custom-slug"
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Custom Mapping Name
                  </label>
                  {!customSlug.trim() && (
                    <button
                      type="button"
                      onClick={() => setCustomSlug("karan-resume")}
                      className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition cursor-pointer"
                    >
                      e.g. Try <span className="font-mono text-zinc-600 dark:text-zinc-300 underline">karan-resume</span>
                    </button>
                  )}
                </div>
                <div
                  className={`flex items-center rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border overflow-hidden transition-all ${
                    customSlug.trim()
                      ? slugChecking
                        ? "border-zinc-300 dark:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-500"
                        : slugAvailability?.available
                          ? "border-emerald-500/80 dark:border-emerald-500/70 ring-1 ring-emerald-500/30"
                          : "border-red-500/80 dark:border-red-500/70 ring-1 ring-red-500/30"
                      : "border-zinc-300 dark:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-500"
                  }`}
                >
                  <span className="px-3 py-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 select-none shrink-0">
                    {getShortDomain().replace(/^https?:\/\//, "")}/
                  </span>
                  <input
                    id="dash-custom-slug"
                    type="text"
                    placeholder="karan-resume"
                    value={customSlug}
                    onChange={(e) =>
                      setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))
                    }
                    className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                  />
                  {customSlug.trim() && (
                    <div className="pr-3 flex items-center shrink-0">
                      {slugChecking ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                      ) : slugAvailability?.available ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Status Message / Availability Feedback */}
                {customSlug.trim() ? (
                  <div className="flex items-center gap-1.5 text-xs pt-0.5">
                    {slugChecking ? (
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                      </span>
                    ) : slugAvailability?.available ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        &ldquo;{slugAvailability.slug}&rdquo; is available!
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {slugAvailability?.message || "Alias is not available"}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Set a custom name (e.g. <span className="font-mono text-zinc-600 dark:text-zinc-400">karan-resume</span>) if available, or leave empty to generate a random code.
                  </p>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Shortened URLs List */}
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Links ({urls.length})
            </h2>

            <button
              type="button"
              onClick={loadUserUrls}
              disabled={isFetchingUrls}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isFetchingUrls ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {fetchError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs"
            >
              {fetchError}
            </div>
          )}

          {isFetchingUrls && urls.length === 0 ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading links...</span>
            </div>
          ) : urls.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                No links created yet
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Use the form above to create your first short link.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {urls.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={item.short_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                      >
                        {item.short_url}
                      </a>
                      {item.title && (
                        <span className="text-zinc-500 dark:text-zinc-400 truncate max-w-xs">
                          — {item.title}
                        </span>
                      )}
                    </div>

                    <p className="text-zinc-500 dark:text-zinc-400 truncate max-w-lg">
                      {item.original_url}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-500">
                      <span suppressHydrationWarning>
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>
                        {item.clicks_count} {item.clicks_count === 1 ? "click" : "clicks"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/dashboard/links/${item.id}`}
                      className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center gap-1 text-xs"
                      title="View link analytics"
                    >
                      <BarChart3 className="w-3 h-3 text-zinc-500" />
                      <span>Analytics</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.short_code, item.short_url)}
                      className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center gap-1"
                      title="Copy short link"
                    >
                      {copiedCode === item.short_code ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <a
                      href={item.short_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      title="Visit link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1 text-zinc-400 hover:text-red-600 transition cursor-pointer rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="Delete link"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
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
