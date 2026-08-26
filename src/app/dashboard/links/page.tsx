"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  Link2,
  ArrowLeft,
  Clock,
  TrendingUp,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Loader2,
  Plus
} from "lucide-react";
import { getUserUrls, deleteUserUrl, type ShortenedUrl } from "@/lib/api";

export default function LinksPage() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadUrls = useCallback(async () => {
    if (!session?.access_token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserUrls(session.access_token);
      setUrls(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load links");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (session?.access_token) {
      loadUrls();
    }
  }, [session?.access_token, loadUrls]);

  const handleCopy = (code: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!session?.access_token || !confirm("Delete this link?")) return;
    try {
      await deleteUserUrl(id, session.access_token);
      setUrls((prev) => prev.filter((u) => u.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <Link
            href="/dashboard#create-link"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow hover:bg-blue-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Link</span>
          </Link>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              All Shortened Links
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Links mapped to your account via the indexed user_id column.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : urls.length === 0 ? (
            <p className="text-center py-12 text-zinc-500 text-sm">No links found yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {urls.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={item.short_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm font-bold text-blue-600 hover:underline"
                      >
                        /{item.short_code}
                      </a>
                      {item.title && (
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                          {item.title}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate max-w-md">{item.original_url}</p>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      <span className="font-semibold text-emerald-600">
                        {item.clicks_count} clicks
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.short_code, item.short_url)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 transition"
                    >
                      {copiedCode === item.short_code ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
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
