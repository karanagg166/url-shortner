"use client";

import React, { useState, useSyncExternalStore, useMemo, useEffect } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { useAuth } from "@/hooks/useAuth";
import {
  shortenUrl,
  formatShortUrl,
  getShortDomain,
  checkSlugAvailability,
  type SlugAvailability,
} from "@/lib/api";
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  SlidersHorizontal,
  X,
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

export interface ShortenedItem {
  id: string;
  originalUrl: string;
  shortUrl: string;
  alias: string;
  createdAt: string;
  clicks?: number;
}

const EMPTY_STORAGE = "[]";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("shortlink_storage_update", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("shortlink_storage_update", callback);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return EMPTY_STORAGE;
  try {
    return localStorage.getItem("shortlink_recent_urls") || EMPTY_STORAGE;
  } catch {
    return EMPTY_STORAGE;
  }
}

function getServerSnapshot(): string {
  return EMPTY_STORAGE;
}

function notifyStorageChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("shortlink_storage_update"));
  }
}

export default function UrlShortenerHero() {
  const { session } = useAuth();
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [showCustomAlias, setShowCustomAlias] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrItem, setActiveQrItem] = useState<ShortenedItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestCreated, setLatestCreated] = useState<ShortenedItem | null>(null);

  // Custom mapping name availability state
  const [aliasChecking, setAliasChecking] = useState(false);
  const [aliasAvailability, setAliasAvailability] = useState<SlugAvailability | null>(null);

  // Debounced real-time custom mapping availability checker
  useEffect(() => {
    const raw = customAlias.trim();
    if (!raw) {
      const timer = setTimeout(() => {
        setAliasAvailability(null);
        setAliasChecking(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const clean = raw.toLowerCase();

    // Client-side quick validation
    if (clean.length < 2) {
      const timer = setTimeout(() => {
        setAliasAvailability({
          available: false,
          slug: clean,
          message: "Custom mapping name must be at least 2 characters.",
          reason: "invalid_format",
        });
        setAliasChecking(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    if (!/^[a-z0-9-_]+$/.test(clean)) {
      const timer = setTimeout(() => {
        setAliasAvailability({
          available: false,
          slug: clean,
          message: "Only letters, numbers, hyphens (-), and underscores (_) are allowed.",
          reason: "invalid_format",
        });
        setAliasChecking(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      setAliasChecking(true);
      try {
        const res = await checkSlugAvailability(clean);
        setAliasAvailability(res);
      } catch {
        setAliasAvailability({
          available: false,
          slug: clean,
          message: "Could not verify alias availability at the moment.",
        });
      } finally {
        setAliasChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customAlias]);

  // Synchronize with localStorage safely using useSyncExternalStore to avoid SSR hydration mismatch
  const storedJson = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const links = useMemo<ShortenedItem[]>(() => {
    try {
      return JSON.parse(storedJson);
    } catch {
      return [];
    }
  }, [storedJson]);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let trimmed = url.trim();
    if (!trimmed) {
      setErrorMessage("Please enter a URL to shorten.");
      return;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      trimmed = "https://" + trimmed;
    }

    try {
      new URL(trimmed);
    } catch {
      setErrorMessage("Please enter a valid URL (e.g. example.com).");
      return;
    }

    const customTrimmed = customAlias.trim();
    if (customTrimmed) {
      if (aliasChecking) {
        setErrorMessage("Checking alias availability... please wait a moment.");
        return;
      }
      if (aliasAvailability && !aliasAvailability.available) {
        setErrorMessage(aliasAvailability.message || "The chosen custom alias is not available.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const hasCustomSlug = Boolean(customTrimmed);
      const result = await shortenUrl(
        {
          original_url: trimmed,
          custom_slug: customTrimmed || undefined,
        },
        session?.access_token
      );

      const displayShortUrl = formatShortUrl(result.short_code, result.short_url);

      const newItem: ShortenedItem = {
        id: result.id,
        originalUrl: result.original_url,
        shortUrl: displayShortUrl,
        alias: result.short_code,
        createdAt: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        clicks: result.clicks_count || 0,
      };

      setLatestCreated(newItem);
      const updated = [newItem, ...links.filter((i) => i.id !== newItem.id).slice(0, 7)];
      try {
        localStorage.setItem("shortlink_recent_urls", JSON.stringify(updated));
        notifyStorageChange();
      } catch {
        // Ignore storage issues
      }

      // Track analytics event (no personal information or full raw URL)
      try {
        track("url_shortened", {
          has_custom_slug: hasCustomSlug,
          is_authenticated: Boolean(session),
        });
      } catch {
        // Safe fallback if analytics blocked
      }

      setUrl("");
      setCustomAlias("");
      setAliasAvailability(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to shorten URL");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);

    try {
      track("short_url_copied");
    } catch {
      // Safe fallback
    }

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem("shortlink_recent_urls");
      notifyStorageChange();
    } catch {
      // Ignore
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Shortener Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <form onSubmit={handleShorten} className="space-y-3.5">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Main URL Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste long link here (e.g. https://github.com/my/project)..."
                className="w-full pl-10 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 transition"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium text-sm rounded-lg transition disabled:opacity-60 cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Shortening...</span>
                </>
              ) : (
                <span>Shorten</span>
              )}
            </button>
          </div>

          {/* Toggle Custom Slug */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <button
              type="button"
              onClick={() => setShowCustomAlias(!showCustomAlias)}
              className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showCustomAlias ? "Hide custom alias" : "Customize alias (optional)"}</span>
            </button>
            <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">
              Instant redirect · Click tracking
            </span>
          </div>

          {/* Custom Slug Input */}
          {showCustomAlias && (
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="custom-alias"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Custom Mapping Name
                </label>
                {!customAlias.trim() && (
                  <button
                    type="button"
                    onClick={() => setCustomAlias("karan-resume")}
                    className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition cursor-pointer"
                  >
                    e.g. Try <span className="font-mono text-zinc-600 dark:text-zinc-300 underline">karan-resume</span>
                  </button>
                )}
              </div>
              <div
                className={`flex items-center rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border overflow-hidden transition-all ${
                  customAlias.trim()
                    ? aliasChecking
                      ? "border-zinc-300 dark:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-500"
                      : aliasAvailability?.available
                        ? "border-emerald-500/80 dark:border-emerald-500/70 ring-1 ring-emerald-500/30"
                        : "border-red-500/80 dark:border-red-500/70 ring-1 ring-red-500/30"
                    : "border-zinc-300 dark:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-500"
                }`}
              >
                <span className="px-3 py-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 select-none shrink-0">
                  {getShortDomain().replace(/^https?:\/\//, "")}/
                </span>
                <input
                  id="custom-alias"
                  type="text"
                  value={customAlias}
                  onChange={(e) =>
                    setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))
                  }
                  placeholder="karan-resume"
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                />
                {customAlias.trim() && (
                  <div className="pr-3 flex items-center shrink-0">
                    {aliasChecking ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                    ) : aliasAvailability?.available ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Status Message / Availability Feedback */}
              {customAlias.trim() ? (
                <div className="flex items-center gap-1.5 text-xs pt-0.5">
                  {aliasChecking ? (
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                    </span>
                  ) : aliasAvailability?.available ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      &ldquo;{aliasAvailability.slug}&rdquo; is available!
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {aliasAvailability?.message || "Alias is not available"}
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

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400"
            >
              {errorMessage}
            </div>
          )}
        </form>

        {/* Latest Created Result Alert Card */}
        {latestCreated && (
          <div className="mt-5 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                Short URL Ready
              </span>
              <p className="font-mono text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 break-all">
                {latestCreated.shortUrl}
              </p>
              <p className="text-xs text-zinc-500 truncate max-w-md">
                ↳ {latestCreated.originalUrl}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(latestCreated.id, latestCreated.shortUrl)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                  copiedId === latestCreated.id
                    ? "bg-emerald-600 text-white"
                    : "bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-600"
                }`}
              >
                {copiedId === latestCreated.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveQrItem(latestCreated)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-600 transition cursor-pointer"
                title="View QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR</span>
              </button>

              <a
                href={latestCreated.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition"
                title="Open short link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Recent Links History List */}
      {links.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Recent Links
            </h2>
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {links.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {item.shortUrl}
                    </span>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 truncate max-w-md">
                    {item.originalUrl}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.shortUrl)}
                    className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="Copy short link"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveQrItem(item)}
                    className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    title="Open link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {!session && (
            <div className="pt-2 text-center text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
              Want permanent link history and detailed analytics?{" "}
              <Link
                href="/login"
                className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-2"
              >
                Sign in to your account
              </Link>
            </div>
          )}
        </div>
      )}

      {/* QR Code Modal with Real Scannable QR Code */}
      {activeQrItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 max-w-xs w-full border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                QR Code
              </span>
              <button
                type="button"
                onClick={() => setActiveQrItem(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {/* Real Scannable QR Code from QR service */}
              <div className="w-40 h-40 bg-white p-2 rounded border border-zinc-200 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    activeQrItem.shortUrl
                  )}`}
                  alt={`QR Code for ${activeQrItem.shortUrl}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <p className="mt-2.5 font-mono text-xs text-zinc-800 dark:text-zinc-200 font-medium break-all text-center">
                {activeQrItem.shortUrl}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleCopy(activeQrItem.id, activeQrItem.shortUrl);
                  setActiveQrItem(null);
                }}
                className="flex-1 py-1.5 px-3 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition cursor-pointer"
              >
                Copy Link
              </button>
              <button
                type="button"
                onClick={() => setActiveQrItem(null)}
                className="py-1.5 px-3 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
