"use client";

import { useState } from "react";
import { Check, LayoutGrid, BookOpen, ListFilter, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { bn } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function PdfPageSelector() {
  const pdfFile = useAppStore((s) => s.pdfFile);
  const pageCount = useAppStore((s) => s.pageCount);
  const thumbnails = useAppStore((s) => s.thumbnails);
  const thumbsLoading = useAppStore((s) => s.thumbsLoading);
  const selectionMode = useAppStore((s) => s.selectionMode);
  const setSelectionMode = useAppStore((s) => s.setSelectionMode);
  const selectedPages = useAppStore((s) => s.selectedPages);
  const togglePage = useAppStore((s) => s.togglePage);
  const applyRange = useAppStore((s) => s.applyRange);
  const selectAllThumbs = useAppStore((s) => s.selectAllThumbs);
  const clearSelection = useAppStore((s) => s.clearSelection);

  const [rangeText, setRangeText] = useState("");

  if (!pdfFile) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-[var(--bd-soft)] bg-[var(--bg-panel2)]/50 px-3.5 py-3 text-[12px] text-[var(--tx-faint)]">
        <LayoutGrid size={15} className="shrink-0" />
        প্রথমে PDF দিন — তারপর এখানে নির্দিষ্ট অধ্যায় বা পাতা বাছাই করতে পারবেন
      </div>
    );
  }

  const effectiveCount = selectionMode === "all" ? pageCount : selectedPages.length;

  return (
    <div className="space-y-2.5">
      {thumbsLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--bd-line)] bg-[var(--bg-panel2)] px-3 py-2 text-[11.5px] font-medium text-[var(--tx-mut)]">
          <Loader2 size={13} className="anim-spin text-[var(--ac)]" />
          পাতাগুলোর থাম্বনেইল প্রিভিউ তৈরি হচ্ছে…
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex rounded-lg border border-[var(--bd-line)] bg-[var(--bg-panel2)] p-0.5">
        <button
          id="mode-all-btn"
          onClick={() => setSelectionMode("all")}
          className={cn(
            "btn-press flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[7px] text-[11.5px] font-bold transition-colors",
            selectionMode === "all"
              ? "bg-[var(--ac)] text-[var(--ac-ink)] shadow-xs"
              : "text-[var(--tx-mut)] hover:text-[var(--tx-ink)]"
          )}
        >
          <BookOpen size={13} />
          সম্পূর্ণ ডকুমেন্ট
        </button>
        <button
          id="mode-custom-btn"
          onClick={() => setSelectionMode("custom")}
          className={cn(
            "btn-press flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[7px] text-[11.5px] font-bold transition-colors",
            selectionMode === "custom"
              ? "bg-[var(--ac)] text-[var(--ac-ink)] shadow-xs"
              : "text-[var(--tx-mut)] hover:text-[var(--tx-ink)]"
          )}
        >
          <ListFilter size={13} />
          পাতা বাছাই
        </button>
      </div>

      {selectionMode === "custom" && (
        <div className="anim-rise space-y-2.5">
          {/* Range input */}
          <div className="flex gap-1.5">
            <input
              id="page-range-input"
              value={rangeText}
              onChange={(e) => setRangeText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyRange(rangeText)}
              placeholder={`যেমন: 1-12, 15 (১–${bn(pageCount)})`}
              className="h-8 min-w-0 flex-1 rounded-lg border border-[var(--bd-line)] bg-[var(--bg-raise)] px-2.5 font-mono text-[11.5px] text-[var(--tx-ink)] placeholder:text-[var(--tx-faint)] focus:border-[var(--ac)]/60 focus:outline-hidden"
            />
            <button
              id="apply-range-btn"
              onClick={() => applyRange(rangeText)}
              className="btn-press h-8 shrink-0 rounded-lg bg-[var(--ac)] px-3 text-[11.5px] font-bold text-[var(--ac-ink)]"
            >
              প্রয়োগ
            </button>
          </div>

          {/* Thumbnails grid */}
          {!thumbsLoading && thumbnails.length > 0 && (
            <div className="grid max-h-[260px] grid-cols-3 gap-1.5 overflow-y-auto rounded-lg border border-[var(--bd-soft)] bg-[var(--bg-panel)] p-1.5">
              {thumbnails.map((t) => {
                const on = selectedPages.includes(t.page);
                return (
                  <button
                    key={t.page}
                    onClick={() => togglePage(t.page)}
                    title={`পাতা ${bn(t.page)} ${on ? "— বাদ দিতে ক্লিক করুন" : "— নির্বাচন করতে ক্লিক করুন"}`}
                    className={cn(
                      "btn-press group relative overflow-hidden rounded-md border-2 bg-[var(--bg-raise)]",
                      on
                        ? "border-[var(--ac)] shadow-[0_0_0_2px_rgba(240,178,62,0.25)]"
                        : "border-[var(--bd-soft)] hover:border-[var(--bd-line)]"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.dataUrl}
                      alt={`পাতা ${bn(t.page)}`}
                      className="block w-full object-cover aspect-3/4"
                      loading="lazy"
                    />
                    <span
                      className={cn(
                        "absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-[5px] border transition-all",
                        on
                          ? "border-[var(--ac)] bg-[var(--ac)] text-[var(--ac-ink)]"
                          : "border-[var(--bd-line)] bg-[var(--bg-panel)]/90 text-transparent group-hover:border-[var(--tx-mut)]"
                      )}
                    >
                      <Check size={10} strokeWidth={3.5} />
                    </span>
                    <span className="absolute right-1 bottom-1 rounded-[5px] bg-black/70 px-1 font-mono text-[9.5px] font-semibold text-white">
                      {bn(t.page)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick select actions */}
          <div className="flex items-center gap-2">
            <button
              id="select-all-thumbs-btn"
              onClick={selectAllThumbs}
              className="btn-press rounded-md border border-[var(--bd-line)] bg-[var(--bg-panel)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tx-mut)] hover:text-[var(--tx-ink)]"
            >
              সব নিন
            </button>
            <button
              id="clear-thumbs-selection-btn"
              onClick={clearSelection}
              className="btn-press rounded-md border border-[var(--bd-line)] bg-[var(--bg-panel)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tx-mut)] hover:text-[var(--danger)]"
            >
              মুছুন
            </button>
            <span className="ml-auto text-[11.5px] font-bold text-amber-700 dark:text-amber-400">
              {bn(selectedPages.length)}টি পাতা নির্বাচিত
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-[var(--tx-faint)] pt-0.5">
        <span>
          মোট পাতা: <span className="font-mono font-semibold text-[var(--tx-mut)]">{bn(pageCount)}</span>
        </span>
        <span>
          বিশ্লেষণ হবে:{" "}
          <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
            {bn(effectiveCount)} পাতা
          </span>
        </span>
      </div>
    </div>
  );
}
