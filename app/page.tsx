"use client";

import dynamic from "next/dynamic";

const AppShell = dynamic(() => import("@/components/AppShell"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0c120f] text-neutral-300">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <p className="font-mono text-sm font-semibold tracking-wide">সূত্র — লোড হচ্ছে…</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return <AppShell />;
}

