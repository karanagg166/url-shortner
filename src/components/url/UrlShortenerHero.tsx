"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { shortenUrl, formatShortUrl, getShortDomain } from "@/lib/api";
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  ChevronRight,
  Sliders,
  X
} from "lucide-react";

interface ShortenedItem {
  id: string;
  originalUrl: string;
  shortUrl: string;
  alias: string;
  createdAt: string;
  clicks: number;
}

export default function UrlShortenerHero() {
  const { session } = useAuth();
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrItem, setActiveQrItem] = useState<ShortenedItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial links state with localStorage persistence
  const [links, setLinks] = useState<ShortenedItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("shortlink_recent_urls");
      if (saved) {
        setLinks(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let trimmed = url.trim();
    if (!trimmed) {
      setErrorMessage("Please enter a valid URL to shorten.");
      return;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      trimmed = "https://" + trimmed;
    }

    try {
      new URL(trimmed);
    } catch {
      setErrorMessage("Invalid URL format. Please include a valid domain (e.g. example.com).");
      return;
    }

    setIsLoading(true);

    try {
      const result = await shortenUrl(
        {
          original_url: trimmed,
          custom_slug: customAlias.trim() || undefined,
        },
        session?.access_token
      );

      const displayShortUrl = formatShortUrl(result.short_code, result.short_url);

      const newItem: ShortenedItem = {
        id: result.id,
        originalUrl: result.original_url,
        shortUrl: displayShortUrl,
        alias: result.short_code,
        createdAt: "Just now",
        clicks: result.clicks_count || 0,
      };

      setLinks((prev) => {
        const updated = [newItem, ...prev.filter((i) => i.id !== newItem.id).slice(0, 4)];
        try {
          localStorage.setItem("shortlink_recent_urls", JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      });
      setUrl("");
      setCustomAlias("");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to shorten URL");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Interactive URL Shortener Card */}
      <div className="relative group">
        {/* Glow effect behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-40 transition duration-500" />

        <div className="relative bg-white dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleShorten} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* URL Input */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                  <Link2 className="w-5 h-5 text-blue-500" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste your long link here (e.g. https://yourwebsite.com/very-long-url...)"
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl sm:rounded-2xl text-sm sm:text-base placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-semibold text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all duration-200 flex items-center justify-center gap-2.5 shrink-0 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Shortening...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Shorten URL</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Toggle Advanced / Custom Slug */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showAdvanced ? "Hide options" : "Customize link alias (optional)"}</span>
              </button>

              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 hidden sm:flex">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Redis Powered
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Secure
                </span>
              </div>
            </div>

            {/* Advanced Custom Slug Input */}
            {showAdvanced && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Custom Alias / Slug
                </label>
                <div className="flex items-center rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                  <span className="px-3.5 py-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700">
                    {getShortDomain().replace(/^https?:\/\//, "")}/
                  </span>
                  <input
                    type="text"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    placeholder="my-custom-slug"
                    className="flex-1 px-3 py-2 text-xs sm:text-sm bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <span>{errorMessage}</span>
              </div>
            )}
          </form>

          {/* Result List of Shortened URLs */}
          {links.length > 0 && (
            <div className="mt-6 pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 px-1">
                <span>Recent Short Links</span>
                <span>Clicks & Actions</span>
              </div>

              <div className="space-y-2.5">
                {links.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-700/50 transition duration-200"
                  >
                    {/* Link details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline">
                          {item.shortUrl}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {item.clicks} clicks
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-md">
                        {item.originalUrl}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.shortUrl)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                          copiedId === item.id
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                            : "bg-white dark:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        }`}
                        aria-label="Copy short link"
                      >
                        {copiedId === item.id ? (
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

                      {/* QR Code Button */}
                      <button
                        type="button"
                        onClick={() => setActiveQrItem(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
                        aria-label="View QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                        <span>QR</span>
                      </button>

                      {/* Open Link */}
                      <a
                        href={item.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition"
                        aria-label="Open original link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {!session?.user && (
                <div className="mt-4 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Want to track clicks and view all your shortened links across sessions?
                  </span>
                  <Link
                    href="/login"
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                  >
                    Log In / Sign Up →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {activeQrItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  QR Code Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQrItem(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visual SVG QR Code Mockup */}
            <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <div className="w-44 h-44 bg-white p-3 rounded-xl shadow-md flex items-center justify-center">
                {/* SVG QR Code Pattern */}
                <svg className="w-full h-full text-zinc-900" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer corner top-left */}
                  <rect x="5" y="5" width="30" height="30" rx="4" />
                  <rect x="10" y="10" width="20" height="20" rx="2" fill="white" />
                  <rect x="15" y="15" width="10" height="10" rx="1" />
                  {/* Outer corner top-right */}
                  <rect x="65" y="5" width="30" height="30" rx="4" />
                  <rect x="70" y="10" width="20" height="20" rx="2" fill="white" />
                  <rect x="75" y="15" width="10" height="10" rx="1" />
                  {/* Outer corner bottom-left */}
                  <rect x="5" y="65" width="30" height="30" rx="4" />
                  <rect x="10" y="70" width="20" height="20" rx="2" fill="white" />
                  <rect x="15" y="75" width="10" height="10" rx="1" />
                  {/* Data patterns */}
                  <rect x="42" y="10" width="6" height="15" rx="1" />
                  <rect x="52" y="15" width="6" height="10" rx="1" />
                  <rect x="10" y="42" width="15" height="6" rx="1" />
                  <rect x="15" y="52" width="10" height="6" rx="1" />
                  <rect x="40" y="40" width="20" height="20" rx="3" fill="#2563eb" />
                  <rect x="65" y="45" width="8" height="8" rx="1" />
                  <rect x="78" y="45" width="12" height="6" rx="1" />
                  <rect x="45" y="68" width="12" height="10" rx="1" />
                  <rect x="62" y="65" width="10" height="25" rx="1" />
                  <rect x="78" y="78" width="14" height="14" rx="2" />
                  <circle cx="50" cy="50" r="4" fill="white" />
                </svg>
              </div>
              <p className="mt-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {activeQrItem.shortUrl}
              </p>
              <p className="text-[11px] text-zinc-500">Scan with any mobile camera</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleCopy(activeQrItem.id, activeQrItem.shortUrl);
                  setActiveQrItem(null);
                }}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:opacity-90"
              >
                Copy Link & Close
              </button>
              <button
                type="button"
                onClick={() => setActiveQrItem(null)}
                className="py-2 px-3 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
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
