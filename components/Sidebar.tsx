"use client";

import { useRef } from "react";
import {
  Wand2,
  Loader2,
  Sparkles,
  RefreshCw,
  FileText,
  FileEdit,
  X,
  ChevronLeft,
} from "lucide-react";
import PdfUploader from "./PdfUploader";
import PdfPageSelector from "./PdfPageSelector";
import TextInputBox from "./TextInputBox";
import HistorySidebar from "./HistorySidebar";
import { useAppStore } from "@/store/useAppStore";
import { bn, shortModel } from "@/lib/format";
import { cn } from "@/lib/utils";

function StepHead({
  num,
  title,
  hint,
}: {
  num: number;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-2 flex items-baseline gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[var(--bd-line)] bg-[var(--bg-panel2)] text-[12px] font-bold text-amber-700 dark:text-amber-400">
        {bn(num)}
      </span>
      <h3 className="text-[14px] font-bold text-[var(--tx-ink)]">{title}</h3>
      {hint && <span className="ml-auto text-[10.5px] text-[var(--tx-faint)]">{hint}</span>}
    </div>
  );
}

function GeneratePanel() {
  const generating = useAppStore((s) => s.generating);
  const progressMsg = useAppStore((s) => s.progressMsg);
  const progressSec = useAppStore((s) => s.progressSec);
  const generate = useAppStore((s) => s.generate);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const inputMode = useAppStore((s) => s.inputMode);
  const pdfFile = useAppStore((s) => s.pdfFile);
  const pastedText = useAppStore((s) => s.pastedText);
  const thumbsLoading = useAppStore((s) => s.thumbsLoading);
  const pageCount = useAppStore((s) => s.pageCount);
  const selectionMode = useAppStore((s) => s.selectionMode);
  const selectedPages = useAppStore((s) => s.selectedPages);
  const model = useAppStore((s) => s.model);
  const error = useAppStore((s) => s.error);
  const setSampleModalOpen = useAppStore((s) => s.setSampleModalOpen);

  const pageN = selectionMode === "all" ? pageCount : selectedPages.length;
  const wordCount = pastedText.trim()
    ? pastedText.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const disabled =
    inputMode === "pdf"
      ? !pdfFile || thumbsLoading || generating
      : !pastedText.trim() || generating;

  const subtitle =
    inputMode === "pdf"
      ? pdfFile
        ? `${bn(pageN)} পাতা • ${shortModel(model)}`
        : "আগে PDF আপলোড করুন"
      : pastedText.trim()
      ? `${bn(wordCount)} শব্দ • ${shortModel(model)}`
      : "আগে টেক্সট পেস্ট বা লিখুন";

  const handleGenerate = () => {
    if (disabled) return;
    // On mobile / tablet screens, smoothly swipe/slide the sidebar away to the canvas interface
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    generate();
  };

  return (
    <div className="space-y-2.5">
      {generating ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-3">
          <div className="flex items-center gap-2 text-[12.5px] font-bold text-[var(--tx-ink)]">
            <Loader2 size={14} className="anim-spin text-amber-600 dark:text-amber-400" />
            <span>{progressMsg}</span>
          </div>
          <div className="shimmer-bar mt-2.5" />
          <p className="mt-1.5 font-mono text-[10px] text-[var(--tx-mut)]">
            {bn(progressSec)} সেকেন্ড অতিক্রান্ত
          </p>
        </div>
      ) : (
        <>
          <button
            id="generate-mindmap-btn"
            onClick={handleGenerate}
            disabled={disabled}
            className={cn(
              "btn-press group relative w-full overflow-hidden rounded-xl px-4 py-3 text-left transition-all",
              disabled
                ? "cursor-not-allowed border border-[var(--bd-line)] bg-[var(--bg-panel2)] text-[var(--tx-faint)]"
                : "bg-[var(--ac)] text-[var(--ac-ink)] shadow-[0_6px_20px_rgba(240,178,62,0.25)] hover:shadow-[0_8px_24px_rgba(240,178,62,0.38)]"
            )}
          >
            <span className="flex items-center gap-2.5">
              <Wand2
                size={18}
                className={cn(!disabled && "transition-transform group-hover:-rotate-12")}
              />
              <span>
                <span className="block text-[15px] leading-tight font-bold">
                  মাইন্ড ম্যাপ তৈরি করুন
                </span>
                <span
                  className={cn(
                    "block text-[11px] font-medium",
                    disabled ? "text-[var(--tx-faint)]" : "text-[var(--ac-ink)]/75"
                  )}
                >
                  {subtitle}
                </span>
              </span>
            </span>
          </button>

          {error && (
            <div className="rounded-xl border border-[var(--danger)]/35 bg-[var(--danger)]/8 p-3 text-[12px]">
              <p className="font-bold text-[var(--danger)]">বিশ্লেষণে সমস্যা হয়েছে</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--tx-ink)]">{error}</p>
              <button
                id="sidebar-retry-btn"
                onClick={handleGenerate}
                className="btn-press mt-2.5 flex items-center gap-1.5 rounded-lg bg-[var(--danger)] px-3 py-1.5 text-[11.5px] font-bold text-white shadow-xs hover:opacity-95"
              >
                <RefreshCw size={12} /> পুনরায় চেষ্টা করুন
              </button>
            </div>
          )}
        </>
      )}

      {((inputMode === "pdf" && !pdfFile) || (inputMode === "text" && !pastedText.trim())) && (
        <button
          id="sidebar-sample-btn"
          onClick={() => setSampleModalOpen(true)}
          className="btn-press flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/5 px-3 py-2 text-center text-[11.5px] font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-500/10"
        >
          <Sparkles size={13} className="shrink-0" />
          ডেমো কালরেখা পরখ করুন (Instant Preview)
        </button>
      )}

      <div className="flex items-center gap-1.5 px-1 pt-1 text-[11px] text-[var(--tx-mut)]">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
        <span>সহজবোধ্য ও মানুষের মতো স্বাভাবিক বাংলা ভাষা সক্রিয়</span>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const inputMode = useAppStore((s) => s.inputMode);
  const setInputMode = useAppStore((s) => s.setInputMode);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Horizontal swipe to the left (more than 45px)
    if (deltaX < -45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex w-full h-full shrink-0 flex-col bg-[var(--bg-panel)] overflow-hidden select-none"
    >
      {/* Mobile-only header with Close Button & swipe hint */}
      <div className="flex items-center justify-between border-b border-[var(--bd-line)] px-3.5 py-2.5 lg:hidden bg-[var(--bg-panel2)]/60">
        <div className="flex items-center gap-1.5">
          <ChevronLeft size={14} className="text-[var(--tx-faint)]" />
          <span className="text-[12.5px] font-bold text-[var(--tx-ink)]">
            ইনপুট ও নিয়ন্ত্রণ প্যানেল
          </span>
        </div>
        <button
          id="mobile-close-sidebar-btn"
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="btn-press flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--bd-line)] bg-[var(--bg-panel)] text-[var(--tx-mut)] hover:text-[var(--tx-ink)]"
          title="সাইডবার লুকান (বাম দিকে সোয়াইপ করুন)"
        >
          <X size={15} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3.5">
        {/* Source Mode Switcher: PDF vs Text */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-[var(--tx-faint)]">
              ইনপুট উৎস নির্বাচন
            </span>
            <span className="text-[10.5px] font-medium text-amber-700 dark:text-amber-400">
              {inputMode === "pdf" ? "PDF বিশ্লেষণ" : "টেক্সট বিশ্লেষণ"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--bd-line)] bg-[var(--bg-panel2)] p-1">
            <button
              id="mode-pdf-btn"
              type="button"
              onClick={() => setInputMode("pdf")}
              className={cn(
                "btn-press flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-bold transition-all",
                inputMode === "pdf"
                  ? "border border-[var(--bd-line)] bg-[var(--bg-panel)] text-amber-700 dark:text-amber-400 shadow-xs"
                  : "text-[var(--tx-mut)] hover:text-[var(--tx-ink)]"
              )}
            >
              <FileText size={14} />
              <span>PDF আপলোড</span>
            </button>
            <button
              id="mode-text-btn"
              type="button"
              onClick={() => setInputMode("text")}
              className={cn(
                "btn-press flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-bold transition-all",
                inputMode === "text"
                  ? "border border-[var(--bd-line)] bg-[var(--bg-panel)] text-amber-700 dark:text-amber-400 shadow-xs"
                  : "text-[var(--tx-mut)] hover:text-[var(--tx-ink)]"
              )}
            >
              <FileEdit size={14} />
              <span>টেক্সট পেস্ট</span>
            </button>
          </div>
        </div>

        {/* Dynamic Sections Based on Mode */}
        {inputMode === "pdf" ? (
          <>
            <section>
              <StepHead num={1} title="ডকুমেন্ট যুক্ত করুন" hint="PDF ড্রপ" />
              <PdfUploader />
            </section>

            <section>
              <StepHead num={2} title="পাতা নির্বাচন" hint="রেঞ্জ / অধ্যায়" />
              <PdfPageSelector />
            </section>

            <section>
              <StepHead num={3} title="এআই মাইন্ড ম্যাপ" />
              <GeneratePanel />
            </section>
          </>
        ) : (
          <>
            <section>
              <StepHead
                num={1}
                title="টেক্সট বা নোট পেস্ট করুন"
                hint="১-ক্লিক সহজ নিয়ন্ত্রণ"
              />
              <TextInputBox />
            </section>

            <section>
              <StepHead num={2} title="এআই মাইন্ড ম্যাপ" />
              <GeneratePanel />
            </section>
          </>
        )}

        <div className="border-t border-[var(--bd-soft)] pt-4">
          <HistorySidebar />
        </div>
      </div>
    </aside>
  );
}

