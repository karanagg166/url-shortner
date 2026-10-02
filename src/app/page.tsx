import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import UrlShortenerHero from "@/components/url/UrlShortenerHero";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            URL Shortener
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Shorten long URLs into compact links with instant redirection and click tracking.
          </p>
        </div>

        <UrlShortenerHero />
      </main>

      <Footer />
    </div>
  );
}
