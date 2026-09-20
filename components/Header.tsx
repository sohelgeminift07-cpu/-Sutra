"use client";

import {
  Cpu,
  Settings,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  GitBranch,
  BookOpenCheck,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { shortModel } from "@/lib/format";
import { cn } from "@/lib/utils";

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" fill="none">
      <circle cx="8" cy="16" r="5" fill="var(--ac)" />
      <circle cx="24" cy="7" r="3.4" fill="var(--k-person)" />
      <circle cx="24" cy="25" r="3.4" fill="var(--k-place)" />
      <path
        d="M12 14.5 21 8M12 17.5 21 24"
        stroke="var(--ac)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Header() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const setSampleModalOpen = useAppStore((s) => s.setSampleModalOpen);
  const model = useAppStore((s) => s.model);
  const hasServerKey = useAppStore((s) => s.hasServerKey);
  const apiKey = useAppStore((s) => s.apiKey);
  const mapName = useAppStore((s) => s.mapName);

  const keyActive = Boolean(apiKey || hasServerKey);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-1.5 sm:gap-3 border-b border-[var(--bd-line)] bg-[var(--bg-panel)] px-2 sm:px-4 select-none w-full min-w-0">
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
        <button
          id="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "সাইডবার লুকান" : "সাইডবার প্রদর্শন করুন"}
          className="btn-press flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--bd-line)] text-[var(--tx-mut)] hover:text-[var(--tx-ink)] hover:bg-[var(--bg-panel2)]"
        >
          {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LogoMark />
          <div className="leading-none flex items-center gap-2">
            <h1 className="font-bold text-[17px] sm:text-[19px] tracking-tight text-[var(--tx-ink)]">
              সূত্র
            </h1>
            <span className="hidden md:inline-block rounded-md border border-[var(--bd-line)] bg-[var(--bg-panel2)] px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-[var(--tx-mut)]">
              PDF → AI মাইন্ড ম্যাপ
            </span>
          </div>
        </div>

        {mapName && (
          <div className="hidden lg:flex min-w-0 items-center gap-1.5 border-l border-[var(--bd-soft)] pl-3 text-[12.5px] font-semibold text-[var(--tx-mut)]">
            <GitBranch size={13} className="shrink-0 text-[var(--tx-faint)]" />
            <span className="truncate max-w-[200px] text-[var(--tx-ink)]" title={mapName}>
              {mapName}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          id="demo-maps-btn"
          onClick={() => setSampleModalOpen(true)}
          className="btn-press flex h-8 w-8 sm:w-auto items-center justify-center sm:justify-start gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-0 sm:px-2.5 text-[11.5px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 shrink-0"
          title="প্রস্তুত করা ডেমো মাইন্ড ম্যাপ দেখুন"
        >
          <BookOpenCheck size={14} className="shrink-0" />
          <span className="hidden sm:inline">ডেমো ম্যাপ</span>
        </button>

        <button
          id="model-selector-btn"
          onClick={() => setSettingsOpen(true)}
          title={`বর্তমান মডেল: ${model} (পরিবর্তন করতে ক্লিক করুন)`}
          className={cn(
            "btn-press flex h-8 max-w-[100px] xs:max-w-[130px] sm:max-w-[190px] items-center gap-1 sm:gap-1.5 rounded-lg border px-1.5 sm:px-2.5 font-mono text-[11px] font-medium shrink-0",
            keyActive
              ? "border-[var(--ok)]/40 bg-[var(--ok)]/10 text-[var(--tx-ink)]"
              : "border-[var(--ac)]/50 bg-[var(--ac)]/10 text-amber-700 dark:text-amber-400"
          )}
        >
          <Cpu size={13} className="shrink-0 text-[var(--ac)]" />
          <span className="truncate hidden sm:inline">{shortModel(model)}</span>
          <span className="truncate inline sm:hidden">{shortModel(model).replace(/^gemini-/i, "")}</span>
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              keyActive ? "bg-[var(--ok)]" : "pulse-dot bg-[var(--ac)]"
            )}
          />
        </button>

        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "লাইট মোড" : "ডার্ক মোড"}
          className="btn-press flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--bd-line)] text-[var(--tx-mut)] hover:text-[var(--tx-ink)] hover:bg-[var(--bg-panel2)]"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <button
          id="settings-modal-btn"
          onClick={() => setSettingsOpen(true)}
          title="সেটিংস ও মডেল কনফিগারেশন"
          className="btn-press flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--bd-line)] text-[var(--tx-mut)] hover:text-[var(--tx-ink)] hover:bg-[var(--bg-panel2)]"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
