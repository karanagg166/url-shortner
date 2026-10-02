"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Link2, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, session, logout } = useAuth();

  return (
    <nav className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold tracking-tight hover:opacity-85 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-md"
          >
            <div className="w-7 h-7 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
              <Link2 className="w-4 h-4" />
            </div>
            <span className="text-base font-semibold">ShortLink</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden sm:flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              href="/"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Shortener
            </Link>
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/links"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Links
                </Link>
              </>
            ) : null}
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              API Docs
            </a>
          </div>

          {/* Right Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 py-1.5 px-2.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[140px]">
                    {user?.email || "Dashboard"}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 py-1.5 px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 px-3 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 px-3.5 py-1.5 rounded-md transition"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-zinc-200 dark:border-zinc-800 py-3 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
            >
              Shortener
            </Link>
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/links"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                >
                  My Links
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md cursor-pointer"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2 px-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 px-3 text-xs font-medium text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-md"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 px-3 text-xs font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-md"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
