"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Loader2,
  Plus,
  BarChart3,
} from "lucide-react";
import { getUserUrls, deleteUserUrl, formatShortUrl, type ShortenedUrl } from "@/lib/api";

export default function LinksPage() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
            setError(err instanceof Error ? err.message : "Failed to load links");
          }
        });
    }
    return () => {
      ignore = true;
    };
  }, [session]);

  const isLoading = Boolean(session?.access_token) && urls.length === 0 && !error;

  const handleCopy = (code: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    try {
      track("short_url_copied");
    } catch {
      // Safe fallback
    }
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!session?.access_token || !window.confirm("Delete this link?")) return;
    try {
      await deleteUserUrl(id, session.access_token);
      setUrls((prev) => prev.filter((u) => u.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading links...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Link</span>
          </Link>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              All Links ({urls.length})
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Manage your created short URLs and view live click counts.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 text-red-600 text-xs border border-red-200"
            >
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading links...</span>
            </div>
          ) : urls.length === 0 ? (
            <p className="text-center py-10 text-zinc-400 text-xs">No links found yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {urls.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <a
                        href={item.short_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                      >
                        {item.short_url}
                      </a>
                      {item.title && (
                        <span className="text-zinc-500 dark:text-zinc-400 truncate">
                          — {item.title}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 truncate max-w-md">{item.original_url}</p>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span suppressHydrationWarning>{new Date(item.created_at).toLocaleDateString()}</span>
                      <span>
                        {item.clicks_count} {item.clicks_count === 1 ? "click" : "clicks"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/dashboard/links/${item.id}`}
                      className="px-2.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center gap-1"
                      title="View link analytics"
                    >
                      <BarChart3 className="w-3 h-3 text-zinc-500" />
                      <span>Analytics</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.short_code, item.short_url)}
                      className="px-2.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center gap-1"
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
                      className="p-1 text-zinc-400 hover:text-red-600 transition cursor-pointer rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="Delete link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
