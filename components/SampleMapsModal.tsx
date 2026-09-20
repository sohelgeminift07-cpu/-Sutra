"use client";

import { useEffect } from "react";
import { X, BookOpenCheck, ArrowRight, Sparkles } from "lucide-react";
import { SAMPLE_MAPS } from "@/lib/sampleMaps";
import { useAppStore } from "@/store/useAppStore";
import { bn } from "@/lib/format";

export default function SampleMapsModal() {
  const open = useAppStore((s) => s.sampleModalOpen);
  const setOpen = useAppStore((s) => s.setSampleModalOpen);
  const loadSampleMap = useAppStore((s) => s.loadSampleMap);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px] select-none"
      onClick={() => setOpen(false)}
    >
      <div
        className="anim-pop max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl border border-[var(--bd-line)] bg-[var(--bg-panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--bd-soft)] bg-[var(--bg-panel)] px-5 py-4 z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ac)]/15 text-amber-700 dark:text-amber-400">
              <BookOpenCheck size={18} />
            </span>
            <div>
              <h2 className="text-[17px] font-bold text-[var(--tx-ink)]">
                তৈরি করা ডেমো কালরেখা
              </h2>
              <p className="text-[11.5px] text-[var(--tx-faint)]">
                যেকোনো একটি নির্বাচন করে ক্যানভাসে সঙ্গে সঙ্গে পরখ করুন
              </p>
            </div>
          </div>
          <button
            id="close-sample-modal-btn"
            onClick={() => setOpen(false)}
            title="বন্ধ করুন (Esc)"
            className="btn-press flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--bd-line)] text-[var(--tx-mut)] hover:text-[var(--tx-ink)] hover:bg-[var(--bg-panel2)]"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          {SAMPLE_MAPS.map((sample) => (
            <div
              key={sample.id}
              className="group rounded-xl border border-[var(--bd-line)] bg-[var(--bg-panel2)]/60 p-4 transition-all hover:border-amber-500/50 hover:bg-[var(--bg-panel2)] hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block rounded-full bg-[var(--ac)]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                    {sample.category}
                  </span>
                  <h3 className="mt-1.5 text-[15px] font-bold text-[var(--tx-ink)]">
                    {sample.name}
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--tx-mut)]">
                    {sample.description}
                  </p>
                  <p className="mt-2 text-[11px] font-mono text-[var(--tx-faint)]">
                    {bn(sample.data.nodes.length)}টি নোড • {bn(sample.data.edges.length)}টি সংযোগ
                  </p>
                </div>

                <button
                  id={`load-sample-${sample.id}-btn`}
                  onClick={() => loadSampleMap(sample.id)}
                  className="btn-press mt-1 flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--ac)] px-3 py-1.5 text-[12px] font-bold text-[var(--ac-ink)] shadow-xs"
                >
                  <span>লোড করুন</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-[var(--bd-line)] bg-[var(--bg-raise)]/40 p-3.5 text-center text-[12px] text-[var(--tx-mut)]">
            <Sparkles size={14} className="mx-auto mb-1 text-[var(--ac)]" />
            ডেমো লোড করার পর প্রতিটি নোড ডাবল-ক্লিক করে এডিট, সরানো বা নতুন সংযোগ তৈরি করা যায়।
          </div>
        </div>
      </div>
    </div>
  );
}
