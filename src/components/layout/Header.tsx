"use client";

import React, { useState } from "react";
import Navbar from "./Navbar";
import { Sparkles, X, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md transition-all">
      {/* Top Notification Announcement Bar */}
      {showBanner && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white text-xs font-medium py-1.5 px-4 sm:px-6 relative transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex-1 flex items-center justify-center gap-2 text-center truncate">
              <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase">
                <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                New Release
              </span>
              <span className="truncate">
                Instant Redis-cached redirects & high-resolution QR generator now live!
              </span>
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center gap-1 underline underline-offset-2 hover:text-white/80 font-semibold"
              >
                Try Free <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="p-1 hover:bg-white/10 rounded-md text-white/80 hover:text-white transition-colors shrink-0"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar />
    </header>
  );
}
