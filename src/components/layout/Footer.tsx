"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Link2,
  Mail,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Shield,
  Zap,
  Globe,
  Heart
} from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
    }, 3000);
  };

  const footerNav = {
    product: [
      { name: "URL Shortener", href: "/" },
      { name: "QR Code Generator", href: "#features" },
      { name: "Link Analytics", href: "#analytics" },
      { name: "Custom Slugs", href: "#features" },
      { name: "GraphQL API", href: "#api" },
    ],
    solutions: [
      { name: "Developers", href: "#api" },
      { name: "Digital Marketers", href: "#features" },
      { name: "Content Creators", href: "#features" },
      { name: "Enterprises", href: "/register" },
      { name: "Social Media", href: "#features" },
    ],
    resources: [
      { name: "Documentation", href: "#api" },
      { name: "GraphQL Playground", href: "http://localhost:8000/graphql", external: true },
      { name: "API Reference", href: "#api" },
      { name: "Architecture Guide", href: "#how-it-works" },
      { name: "System Status", href: "#status" },
    ],
    company: [
      { name: "About ShortLink", href: "/" },
      { name: "Privacy Policy", href: "#privacy" },
      { name: "Terms of Service", href: "#terms" },
      { name: "Security & Encryption", href: "#security" },
      { name: "Support Center", href: "#support" },
    ],
  };

  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800/80 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Newsletter & Banner Callout */}
        <div className="pb-12 border-b border-zinc-800/80 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Stay ahead with smarter links
            </h3>
            <p className="text-sm text-zinc-400 max-w-md">
              Subscribe to our newsletter for product updates, link optimization tips, and developer release notes.
            </p>
          </div>
          <div className="lg:col-span-6">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <button
                type="submit"
                className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {subscribed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Subscribed!</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Middle Navigation Columns */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="col-span-2 lg:col-span-1 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Link2 className="w-4.5 h-4.5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                ShortLink
              </span>
            </Link>
            <p className="text-xs text-zinc-400 leading-relaxed pr-4">
              Modern, lightning-fast URL shortening, real-time analytics, and instant QR generation powered by FastAPI, Redis, and Next.js.
            </p>
            {/* Operational Status */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs">
              {footerNav.product.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Solutions
            </h4>
            <ul className="space-y-2.5 text-xs">
              {footerNav.solutions.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs">
              {footerNav.resources.map((item) => (
                <li key={item.name}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <span>{item.name}</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Legal & Info
            </h4>
            <ul className="space-y-2.5 text-xs">
              {footerNav.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Tech Badges */}
        <div className="pt-8 border-t border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} ShortLink Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <a
              href="https://github.com/karanagg166/url-shortner"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white p-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
              aria-label="GitHub Repository"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a
              href="#twitter"
              className="hover:text-white p-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
              aria-label="Twitter profile"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="mailto:contact@shortlink.dev"
              className="hover:text-white p-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
              aria-label="Contact email"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            <span>Powered by</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
              FastAPI
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
              Redis
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
              Next.js 16
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
