"use client";

import React from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 text-xs py-8 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Note */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
            <Link2 className="w-3 h-3" />
          </div>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            ShortLink
          </span>
          <span className="text-zinc-400 dark:text-zinc-600">·</span>
          <span>Fast, minimal URL shortener</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Shortener
          </Link>
          <Link
            href="/dashboard"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Dashboard
          </Link>
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            API
          </a>
          <a
            href="https://github.com/karanagg166/url-shortner"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
