"use client";

import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const STYLES = {
  success: {
    icon: CheckCircle2,
    cls: "border-emerald-500/50 bg-[var(--bg-panel)] text-emerald-600 dark:text-emerald-400",
  },
  error: {
    icon: AlertTriangle,
    cls: "border-[var(--danger)]/50 bg-[var(--bg-panel)] text-[var(--danger)]",
  },
  info: {
    icon: Info,
    cls: "border-[var(--bd-line)] bg-[var(--bg-panel)] text-[var(--tx-ink)]",
  },
};

export default function Toasts() {
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-12 z-[60] flex w-[330px] flex-col gap-2">
      {toasts.map((t) => {
        const s = STYLES[t.kind] || STYLES.info;
        const Icon = s.icon;
        return (
          <div
            key={t.id}
            className={cn(
              "anim-toast pointer-events-auto flex items-start gap-2.5 rounded-xl border p-3 shadow-xl backdrop-blur-md select-none",
              s.cls
            )}
          >
            <Icon size={16} className="mt-0.5 shrink-0" />
            <p className="min-w-0 flex-1 text-[12.5px] leading-snug font-semibold text-[var(--tx-ink)]">
              {t.msg}
            </p>
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 rounded p-0.5 text-[var(--tx-faint)] hover:text-[var(--tx-ink)]"
              title="বন্ধ করুন"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
