"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";
import { Link2, Loader2 } from "lucide-react";

function RegisterFormFallback() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 flex items-center justify-center min-h-[420px]">
      <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold text-xl tracking-tight text-zinc-900 dark:text-zinc-100 hover:opacity-85 transition-opacity"
          >
            <div className="w-7 h-7 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <span>ShortLink</span>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 pt-2">
            Create an account
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sign up to track link clicks and manage custom short URLs
          </p>
        </div>

        {/* Dynamic Register Form Component */}
        <Suspense fallback={<RegisterFormFallback />}>
          <RegisterForm />
        </Suspense>

        {/* Footer Link to Login */}
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline transition"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
