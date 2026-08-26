"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";
import { Link2, Loader2, ShieldCheck } from "lucide-react";

function RegisterFormFallback() {
  return (
    <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex items-center justify-center min-h-[460px]">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors relative">
      {/* Background Decorative Ambient Blur */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center -z-10">
        <div className="w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl -translate-y-16 -translate-x-20" />
        <div className="w-[450px] h-[450px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl translate-y-20 translate-x-20" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-bold text-2xl tracking-tight hover:opacity-80 transition-opacity mb-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Link2 className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent font-extrabold">
              ShortLink
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create an account
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            Start shortening, branding, and tracking your links in seconds
          </p>
        </div>

        {/* Dynamic Register Form Component */}
        <Suspense fallback={<RegisterFormFallback />}>
          <RegisterForm />
        </Suspense>

        {/* Footer Link to Login */}
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline transition"
          >
            Log in here
          </Link>
        </p>

        {/* Security / Privacy badge */}
        <div className="mt-8 text-center text-[11px] text-zinc-400 dark:text-zinc-600 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>256-bit SSL encrypted • Supabase Auth Protected</span>
        </div>
      </div>
    </div>
  );
}
