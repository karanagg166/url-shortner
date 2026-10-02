"use client";

import React from "react";
import Navbar from "./Navbar";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <Navbar />
    </header>
  );
}
