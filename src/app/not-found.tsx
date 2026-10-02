import React from "react";
import Link from "next/link";
import { Link2, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4">
      <div className="max-w-md w-full text-center space-y-5 p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center mx-auto">
          <Link2 className="w-5 h-5" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-mono font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            404 Error
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Link Not Found
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The short URL or page you requested does not exist, has expired, or may have been removed.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Shortener</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
