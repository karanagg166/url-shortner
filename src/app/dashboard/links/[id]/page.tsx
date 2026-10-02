"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  MousePointerClick,
  Calendar,
  Globe,
  Monitor,
  Compass,
  Laptop,
  AlertCircle,
} from "lucide-react";
import {
  getUrlAnalytics,
  formatShortUrl,
  type UrlAnalytics,
} from "@/lib/api";

type RangeOption = "7d" | "30d" | "90d" | "all";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LinkAnalyticsPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const urlId = resolvedParams.id;
  const { session, isLoading: isAuthLoading } = useAuth();

  const [analytics, setAnalytics] = useState<UrlAnalytics | null>(null);
  const [range, setRange] = useState<RangeOption>("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hoveredTimelineIndex, setHoveredTimelineIndex] = useState<number | null>(null);

  const handleRefresh = useCallback(async () => {
    if (!session?.access_token || !urlId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUrlAnalytics(urlId, session.access_token, range);
      setAnalytics(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load link analytics");
    } finally {
      setIsLoading(false);
    }
  }, [session, urlId, range]);

  useEffect(() => {
    if (!isAuthLoading && !session) {
      router.push("/login");
      return;
    }

    let ignore = false;
    const token = session?.access_token;
    if (token && urlId) {
      getUrlAnalytics(urlId, token, range)
        .then((data) => {
          if (!ignore) {
            setAnalytics(data);
            setIsLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (!ignore) {
            setError(err instanceof Error ? err.message : "Failed to load link analytics");
            setIsLoading(false);
          }
        });
    }

    return () => {
      ignore = true;
    };
  }, [session, isAuthLoading, urlId, range, router]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isAuthLoading || (isLoading && !analytics)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading link analytics...</span>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <Link
            href="/dashboard/links"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Links</span>
          </Link>
          <div className="p-6 rounded-xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Unable to load analytics
            </h2>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const shortUrl = analytics ? formatShortUrl(analytics.short_code) : "";
  const timelineData = analytics?.timeline || [];
  const maxClicksInTimeline = Math.max(...timelineData.map((t) => t.clicks), 1);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Link
                href="/dashboard"
                className="hover:text-zinc-900 dark:hover:text-zinc-100 transition"
              >
                Dashboard
              </Link>
              <span>/</span>
              <Link
                href="/dashboard/links"
                className="hover:text-zinc-900 dark:hover:text-zinc-100 transition"
              >
                Links
              </Link>
              <span>/</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                Analytics
              </span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {analytics?.title || `/${analytics?.short_code}`}
            </h1>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-zinc-800/70 p-1 rounded-lg self-start sm:self-auto">
            {(
              [
                { label: "7 Days", value: "7d" },
                { label: "30 Days", value: "30d" },
                { label: "90 Days", value: "90d" },
                { label: "All Time", value: "all" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRange(opt.value)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                  range === opt.value
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh stats"
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Link Details Card */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-medium text-sm text-zinc-900 dark:text-zinc-100 hover:underline"
              >
                {shortUrl}
              </a>
              <button
                type="button"
                onClick={() => handleCopy(shortUrl)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Copy short link"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Visit link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 truncate max-w-xl">
              Destination:{" "}
              <a
                href={analytics?.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {analytics?.original_url}
              </a>
            </p>
          </div>
          {analytics?.last_clicked_at && (
            <div className="text-[11px] text-zinc-400 shrink-0" suppressHydrationWarning>
              Last active: {new Date(analytics.last_clicked_at).toLocaleString()}
            </div>
          )}
        </div>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs">Total Clicks</span>
              <MousePointerClick className="w-4 h-4" />
            </div>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {analytics?.total_clicks ?? 0}
            </p>
            {analytics?.bot_clicks && analytics.bot_clicks > 0 ? (
              <p className="text-[11px] text-zinc-400">
                ({analytics.bot_clicks} bot {analytics.bot_clicks === 1 ? "click" : "clicks"})
              </p>
            ) : null}
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs">Unique Visitors</span>
              <Users className="w-4 h-4" />
            </div>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {analytics?.unique_visitors ?? 0}
            </p>
            <p className="text-[11px] text-zinc-400">Approximate unique</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs">Clicks Today</span>
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {analytics?.clicks_today ?? 0}
            </p>
            <p className="text-[11px] text-zinc-400">Since UTC 00:00</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs">Last 7 Days</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {analytics?.clicks_7d ?? 0}
            </p>
            <p className="text-[11px] text-zinc-400">
              30d: {analytics?.clicks_30d ?? 0}
            </p>
          </div>
        </div>

        {/* Clicks Over Time (Timeline Chart) */}
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Clicks Over Time
              </h2>
              <p className="text-xs text-zinc-500">
                Daily activity for selected period ({range})
              </p>
            </div>
          </div>

          {timelineData.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              No click events recorded for this timeframe yet.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-44 w-full flex items-end gap-1.5 pt-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                {timelineData.map((item, idx) => {
                  const heightPercent = Math.max(
                    (item.clicks / maxClicksInTimeline) * 100,
                    item.clicks > 0 ? 8 : 2
                  );
                  const isHovered = hoveredTimelineIndex === idx;

                  return (
                    <div
                      key={item.date}
                      className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                      onMouseEnter={() => setHoveredTimelineIndex(idx)}
                      onMouseLeave={() => setHoveredTimelineIndex(null)}
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-10 z-10 px-2 py-1 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] shadow whitespace-nowrap pointer-events-none">
                          <span className="font-semibold">{item.clicks}</span> {item.clicks === 1 ? "click" : "clicks"} on {item.date}
                        </div>
                      )}
                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[28px] rounded-t transition-all ${
                          isHovered
                            ? "bg-zinc-900 dark:bg-zinc-100"
                            : "bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-axis date labels */}
              <div className="flex justify-between text-[10px] text-zinc-400 px-1">
                <span>{timelineData[0]?.date}</span>
                {timelineData.length > 2 && (
                  <span>{timelineData[Math.floor(timelineData.length / 2)]?.date}</span>
                )}
                <span>{timelineData[timelineData.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>

        {/* 2-Column: Top Countries & Top Sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Countries */}
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Top Countries
              </h2>
            </div>

            {(!analytics?.countries || analytics.countries.length === 0) ? (
              <p className="text-xs text-zinc-400 py-6 text-center">No location data yet.</p>
            ) : (
              <div className="space-y-3">
                {analytics.countries.map((c) => (
                  <div key={c.country} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {c.country}
                      </span>
                      <span className="text-zinc-500">
                        {c.clicks} ({c.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                        style={{ width: `${Math.min(c.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Referrers */}
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Top Sources / Referrers
              </h2>
            </div>

            {(!analytics?.referrers || analytics.referrers.length === 0) ? (
              <p className="text-xs text-zinc-400 py-6 text-center">No referrer data yet.</p>
            ) : (
              <div className="space-y-3">
                {analytics.referrers.map((r) => (
                  <div key={r.source} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 font-mono">
                        {r.source}
                      </span>
                      <span className="text-zinc-500">
                        {r.clicks} ({r.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                        style={{ width: `${Math.min(r.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3-Column: Devices, Browsers, Operating Systems */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Devices */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              <Laptop className="w-3.5 h-3.5 text-zinc-500" />
              <span>Devices</span>
            </div>
            {(!analytics?.devices || analytics.devices.length === 0) ? (
              <p className="text-xs text-zinc-400 py-3">No device data</p>
            ) : (
              <div className="space-y-2 text-xs">
                {analytics.devices.map((d) => (
                  <div key={d.device} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-700 dark:text-zinc-300">{d.device}</span>
                      <span className="text-zinc-500">{d.percentage}%</span>
                    </div>
                    <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-700 dark:bg-zinc-300 rounded-full"
                        style={{ width: `${d.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Browsers */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              <Monitor className="w-3.5 h-3.5 text-zinc-500" />
              <span>Browsers</span>
            </div>
            {(!analytics?.browsers || analytics.browsers.length === 0) ? (
              <p className="text-xs text-zinc-400 py-3">No browser data</p>
            ) : (
              <div className="space-y-2 text-xs">
                {analytics.browsers.map((b) => (
                  <div key={b.browser} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-700 dark:text-zinc-300">{b.browser}</span>
                      <span className="text-zinc-500">{b.percentage}%</span>
                    </div>
                    <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-700 dark:bg-zinc-300 rounded-full"
                        style={{ width: `${b.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operating Systems */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              <Laptop className="w-3.5 h-3.5 text-zinc-500" />
              <span>Operating Systems</span>
            </div>
            {(!analytics?.operating_systems || analytics.operating_systems.length === 0) ? (
              <p className="text-xs text-zinc-400 py-3">No OS data</p>
            ) : (
              <div className="space-y-2 text-xs">
                {analytics.operating_systems.map((o) => (
                  <div key={o.os} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-700 dark:text-zinc-300">{o.os}</span>
                      <span className="text-zinc-500">{o.percentage}%</span>
                    </div>
                    <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-700 dark:bg-zinc-300 rounded-full"
                        style={{ width: `${o.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Cities (if available) */}
        {analytics?.cities && analytics.cities.length > 0 && (
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Top Cities
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {analytics.cities.map((ci) => (
                <div
                  key={`${ci.city}-${ci.country}`}
                  className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs"
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {ci.city}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {ci.country} — {ci.clicks} {ci.clicks === 1 ? "click" : "clicks"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Click Activity Table */}
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Recent Click Activity
            </h2>
            <p className="text-xs text-zinc-500">
              Last {analytics?.recent_clicks?.length || 0} visits (no IP addresses stored)
            </p>
          </div>

          {(!analytics?.recent_clicks || analytics.recent_clicks.length === 0) ? (
            <p className="text-center py-8 text-xs text-zinc-400">
              No click events recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[11px]">
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Location</th>
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 font-medium">Device</th>
                    <th className="pb-2 font-medium">Browser</th>
                    <th className="pb-2 font-medium">OS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {analytics.recent_clicks.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                      <td className="py-2.5 text-zinc-500 whitespace-nowrap" suppressHydrationWarning>
                        {new Date(item.clicked_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5 text-zinc-800 dark:text-zinc-200">
                        {item.city ? `${item.city}, ` : ""}
                        {item.country || "Unknown"}
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        {item.referrer_domain || "Direct"}
                      </td>
                      <td className="py-2.5 text-zinc-600 dark:text-zinc-400">
                        {item.device_type || "Unknown"}
                      </td>
                      <td className="py-2.5 text-zinc-600 dark:text-zinc-400">
                        {item.browser || "Other"}
                      </td>
                      <td className="py-2.5 text-zinc-600 dark:text-zinc-400">
                        {item.os || "Other"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
