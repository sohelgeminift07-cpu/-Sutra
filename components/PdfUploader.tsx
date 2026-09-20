"use client";

import { useRef, useState } from "react";
import { FileUp, FileText, X, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { bn, fmtBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function PdfUploader() {
  const pdfFile = useAppStore((s) => s.pdfFile);
  const pdfName = useAppStore((s) => s.pdfName);
  const pdfSize = useAppStore((s) => s.pdfSize);
  const pageCount = useAppStore((s) => s.pageCount);
  const loadPdf = useAppStore((s) => s.loadPdf);
  const clearPdf = useAppStore((s) => s.clearPdf);
  const setSampleModalOpen = useAppStore((s) => s.setSampleModalOpen);

  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) loadPdf(f);
  };

  if (pdfFile) {
    return (
      <div className="anim-pop rounded-xl border border-[var(--bd-line)] bg-[var(--bg-panel2)] p-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ac)]/15 text-amber-700 dark:text-amber-400">
            <FileText size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-bold text-[var(--tx-ink)]" title={pdfName}>
              {pdfName}
            </p>
            <p className="font-mono text-[10.5px] text-[var(--tx-mut)]">
              {pageCount ? `${bn(pageCount)} পাতা` : "পড়া হচ্ছে…"} • {fmtBytes(pdfSize)}
            </p>
          </div>
          <button
            id="clear-pdf-btn"
            onClick={clearPdf}
            title="PDF বাদ দিন"
            className="btn-press flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--bd-line)] text-[var(--tx-mut)] hover:border-[var(--danger)]/50 hover:text-[var(--danger)] hover:bg-[var(--bg-panel)]"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        id="pdf-dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={cn(
          "btn-press cursor-pointer rounded-xl border-2 border-dashed border-[var(--bd-line)] bg-[var(--bg-panel2)]/60 px-4 py-5 text-center transition-all",
          over && "dropzone-on"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) loadPdf(f);
          }}
        />
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--bd-line)] bg-[var(--bg-panel)] text-[var(--ac)]">
          <FileUp size={20} />
        </span>
        <p className="mt-2 text-[13px] font-bold text-[var(--tx-ink)]">
          PDF টেনে আনুন <span className="font-normal text-[var(--tx-mut)]">বা ব্রাউজ করুন</span>
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--tx-faint)]">
          বই, ইতিহাসের অধ্যায় বা আর্টিকেল (সর্বোচ্চ ৮০MB)
        </p>
      </div>

      <button
        id="quick-demo-btn"
        onClick={() => setSampleModalOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-1 text-[11.5px] font-medium text-amber-700 dark:text-amber-400 hover:underline"
      >
        <Sparkles size={12} />
        ফাইল নেই? তৈরি করা ডেমো কালরেখা পরখ করুন
      </button>
    </div>
  );
}
