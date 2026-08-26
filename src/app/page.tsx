"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import UrlShortenerHero from "@/components/url/UrlShortenerHero";
import {
  Zap,
  BarChart3,
  QrCode,
  ShieldCheck,
  Globe2,
  Code2,
  Sparkles,
  ArrowRight,
  Check,
  ChevronDown,
  TrendingUp,
  MousePointerClick,
  Smartphone,
  Server,
  Layers,
  Lock,
  Share2,
  Database
} from "lucide-react";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeCodeTab, setActiveCodeTab] = useState<"graphql" | "curl" | "python">("graphql");

  const faqs = [
    {
      q: "How fast are the short URL redirects?",
      a: "Our redirects are powered by Redis 7 in-memory caching, delivering sub-5ms response times worldwide. The cached lookup bypasses database queries for immediate routing.",
    },
    {
      q: "Can I customize link aliases and slugs?",
      a: "Yes! You can choose custom aliases (e.g., short.link/my-product) or let our system automatically generate a unique, compact 6-character random slug.",
    },
    {
      q: "What analytics are tracked for each shortened URL?",
      a: "You get full visibility into total clicks, unique visitors, referring websites, country-level geolocation, device types (desktop vs. mobile), and timestamp distributions.",
    },
    {
      q: "Does ShortLink support GraphQL and API integrations?",
      a: "Yes! ShortLink provides a fully-typed GraphQL API at /graphql built with Strawberry GraphQL and FastAPI. You can create, query, and analyze links programmatically.",
    },
    {
      q: "Are the generated QR codes dynamic?",
      a: "Every shortened URL comes with an instant high-resolution QR code that you can scan, download, or print. It automatically redirects to your target destination.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-blue-500 selection:text-white transition-colors">
      {/* Top Header with Navbar */}
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
          {/* Ambient Gradient Background Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/15 to-violet-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Next-Gen URL Shortener & Real-Time Analytics</span>
            </div>

            {/* Main Headline */}
            <h1 className="max-w-4xl mx-auto text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15] mb-6">
              Shorten links.{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Expand reach.
              </span>{" "}
              Track everything.
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-10">
              Supercharge your links with sub-5ms Redis caching, custom aliases,
              instant QR codes, and granular click analytics — built for modern creators & developers.
            </p>

            {/* Interactive URL Shortener Widget */}
            <UrlShortenerHero />

            {/* Social Proof & Metrics */}
            <div className="mt-16 pt-10 border-t border-zinc-200/80 dark:border-zinc-800/80 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
                  10M+
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Links Shortened
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                  &lt; 5ms
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Redirect Latency
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
                  99.99%
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Guaranteed Uptime
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  180+
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Countries Served
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-20 bg-zinc-100/60 dark:bg-zinc-900/40 border-y border-zinc-200/70 dark:border-zinc-800/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Core Capabilities
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Everything you need to manage and scale your links
              </p>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                Built from the ground up for high traffic, speed, and real-time observability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1: Fast Redis Caching */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700/60 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  In-Memory Redis Caching
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Sub-millisecond redirect lookups powered by Redis 7. Handle massive traffic spikes without database bottlenecks.
                </p>
              </div>

              {/* Feature 2: Real-time Analytics */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700/60 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Real-Time Analytics
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Track clicks as they happen. Inspect geographic breakdown, referrers, browsers, and conversion metrics in live dashboards.
                </p>
              </div>

              {/* Feature 3: Dynamic QR Codes */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700/60 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Dynamic QR Codes
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Generate print-ready vector QR codes instantly for any link. Perfect for physical packaging, business cards, and billboards.
                </p>
              </div>

              {/* Feature 4: Custom Aliases & Branding */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700/60 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Globe2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Custom Slugs & Aliases
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Personalize your URLs with memorable keywords. Boost click-through rates by up to 34% with branded link paths.
                </p>
              </div>

              {/* Feature 5: GraphQL & REST API */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700/60 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Developer First API
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Full GraphQL API powered by Strawberry GraphQL and FastAPI. Automate link generation in your CI/CD pipelines and apps.
                </p>
              </div>

              {/* Feature 6: Enterprise Security */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700/60 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Enterprise Security
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Phishing protection, SSL encryption, rate limiting, and Supabase Row Level Security ensure your data and users stay safe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Simple Workflow
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                How ShortLink Works in 3 Steps
              </p>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                Create, customize, and start monitoring your links in seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-md shadow-blue-500/25">
                  1
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Paste & Customize
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Paste any long destination URL. Optional: Choose your own customized keyword slug for enhanced brand recall.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative space-y-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center shadow-md shadow-indigo-500/25">
                  2
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Generate & Share
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Instantly get your short link cached in Redis, accompanied by a dynamic high-resolution QR code ready to share.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative space-y-4">
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white font-bold flex items-center justify-center shadow-md shadow-violet-500/25">
                  3
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Observe & Optimize
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Watch live clicks roll in on your dashboard. Filter by location, referring domain, operating system, and device.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ANALYTICS SHOWCASE MOCKUP SECTION */}
        <section id="analytics" className="py-20 bg-zinc-100/60 dark:bg-zinc-900/40 border-y border-zinc-200/70 dark:border-zinc-800/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left description */}
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Real-Time Insights</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                  Granular analytics for every single click
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                  Stop guessing where your audience comes from. Our analytics engine gives you deep insights into audience behavior, referrers, and campaign performance.
                </p>

                <ul className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Country & city level geolocation heatmaps</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Referrer attribution (Twitter/X, LinkedIn, Google)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Device & OS breakdown (iOS, Android, macOS, Windows)</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition"
                  >
                    <span>View Sample Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Dashboard Mockup */}
              <div className="lg:col-span-7">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
                  {/* Top Bar of Mockup */}
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="ml-2 text-xs font-mono text-zinc-400">
                        short.link/summer-campaign-2026
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                      Live
                    </span>
                  </div>

                  {/* Stat Cards in Mockup */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[11px] text-zinc-500">Total Clicks</p>
                      <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                        48,290
                      </p>
                      <span className="text-[10px] text-emerald-500 font-semibold">
                        ↑ +24.8% this week
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[11px] text-zinc-500">Unique Visitors</p>
                      <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                        39,120
                      </p>
                      <span className="text-[10px] text-emerald-500 font-semibold">
                        81% unique rate
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[11px] text-zinc-500">Avg. Redirect</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                        3.2 ms
                      </p>
                      <span className="text-[10px] text-zinc-400">Redis cache hit</span>
                    </div>
                  </div>

                  {/* Simulated Chart Bars */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-zinc-500 font-medium">
                      <span>Hourly Clicks (Last 24 Hours)</span>
                      <span>Peak: 4,820 clicks/hr</span>
                    </div>
                    <div className="h-28 flex items-end gap-1.5 pt-4 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      {[
                        30, 45, 60, 80, 50, 40, 70, 90, 65, 85, 95, 100, 75, 80,
                        90, 85, 60, 70, 88, 92, 78, 65, 50, 40,
                      ].map((val, idx) => (
                        <div
                          key={idx}
                          className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-sm hover:opacity-80 transition-all cursor-pointer"
                          style={{ height: `${val}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Top Referrers and Countries */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                        Top Referrers
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                          <span>Twitter / X</span>
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            48%
                          </span>
                        </div>
                        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                          <span>Google Search</span>
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            32%
                          </span>
                        </div>
                        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                          <span>Direct / Email</span>
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            20%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                        Top Geographies
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                          <span>🇺🇸 United States</span>
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            42%
                          </span>
                        </div>
                        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                          <span>🇮🇳 India</span>
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            28%
                          </span>
                        </div>
                        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                          <span>🇩🇪 Germany</span>
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            15%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DEVELOPER / GRAPHQL API SECTION */}
        <section id="api" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Developer Friendly
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Powerful GraphQL & REST APIs
              </p>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                Integrate link shortening into your backend or workflows with our Strawberry GraphQL engine.
              </p>
            </div>

            {/* Code switcher block */}
            <div className="max-w-3xl mx-auto rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
              {/* Tab Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab("graphql")}
                    className={`px-3 py-1.5 rounded-lg font-mono font-medium transition cursor-pointer ${
                      activeCodeTab === "graphql"
                        ? "bg-blue-600 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    GraphQL
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab("curl")}
                    className={`px-3 py-1.5 rounded-lg font-mono font-medium transition cursor-pointer ${
                      activeCodeTab === "curl"
                        ? "bg-blue-600 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab("python")}
                    className={`px-3 py-1.5 rounded-lg font-mono font-medium transition cursor-pointer ${
                      activeCodeTab === "python"
                        ? "bg-blue-600 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Python
                  </button>
                </div>
                <a
                  href="http://localhost:8000/graphql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Playground</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>

              {/* Code Content */}
              <div className="p-5 font-mono text-xs sm:text-sm text-zinc-300 overflow-x-auto leading-relaxed">
                {activeCodeTab === "graphql" && (
                  <pre>{`mutation ShortenLink {
  createShortUrl(input: {
    originalUrl: "https://yourwebsite.com/long-page-slug",
    customAlias: "product-launch"
  }) {
    id
    shortUrl
    alias
    createdAt
    qrCodeSvg
  }
}`}</pre>
                )}

                {activeCodeTab === "curl" && (
                  <pre>{`curl -X POST http://localhost:8000/graphql \\
  -H "Content-Type: application/json" \\
  -d '{"query": "mutation { createShortUrl(input: { originalUrl: \\"https://example.com\\" }) { shortUrl } }"}'`}</pre>
                )}

                {activeCodeTab === "python" && (
                  <pre>{`import httpx

query = """
mutation {
  createShortUrl(input: { originalUrl: "https://example.com" }) {
    shortUrl
    alias
  }
}
"""

response = httpx.post("http://localhost:8000/graphql", json={"query": query})
print(response.json())`}</pre>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-20 bg-zinc-100/60 dark:bg-zinc-900/40 border-y border-zinc-200/70 dark:border-zinc-800/70">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                FAQ
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Frequently Asked Questions
              </p>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                Have questions about ShortLink? We have answers.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full py-4 px-6 flex items-center justify-between text-left font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-180 text-blue-500" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60 animate-in fade-in duration-150">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION BANNER */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl p-8 sm:p-14 overflow-hidden bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-2xl text-center space-y-6">
              {/* Background ambient pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight relative z-10">
                Ready to take full control of your links?
              </h2>
              <p className="max-w-2xl mx-auto text-base sm:text-lg text-blue-100 relative z-10 leading-relaxed">
                Join thousands of developers, creators, and teams shortening millions of URLs with sub-millisecond redirect speeds.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 relative z-10">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-zinc-100 text-blue-700 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <span>Get Started for Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-2xl transition-all duration-200 text-sm sm:text-base"
                >
                  Sign In to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Main Footer */}
      <Footer />
    </div>
  );
}
