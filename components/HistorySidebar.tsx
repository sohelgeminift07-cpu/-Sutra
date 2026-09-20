"use client";

import { History, Trash2, Map as MapIcon, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { bn, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function HistorySidebar() {
  const history = useAppStore((s) => s.history);
  const mapId = useAppStore((s) => s.mapId);
  const loadFromHistory = useAppStore((s) => s.loadFromHistory);
  const deleteFromHistory = useAppStore((s) => s.deleteFromHistory);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const toast = useAppStore((s) => s.toast);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[var(--tx-mut)] uppercase">
          <History size={13} />
          ইতিহাস
          {history.length > 0 && (
            <span className="rounded-md bg-[var(--bg-panel2)] px-1.5 font-mono text-[10px]">
              {bn(history.length)}
            </span>
          )}
        </h3>
        {history.length > 0 && (
          <button
            id="clear-all-history-btn"
            onClick={() => {
              clearHistory();
              toast("info", "হিস্ট্রি খালি করা হয়েছে");
            }}
            title="সব রেকর্ড মুছুন"
            className="btn-press flex h-6 items-center gap-1 rounded-md px-1.5 text-[10.5px] font-semibold text-[var(--tx-faint)] hover:text-[var(--danger)]"
          >
            <Trash2 size={11} /> সব মুছুন
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--bd-line)] px-4 py-5 text-center">
          <Sparkles size={17} className="text-[var(--tx-faint)]" />
          <p className="text-[11.5px] leading-relaxed text-[var(--tx-faint)]">
            এখনো কোনো ম্যাপ তৈরি হয়নি।
            <br />
            জেনারেট বা ইমপোর্ট করা ম্যাপ এখানে সংরক্ষিত থাকবে।
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
          {history.map((h) => (
            <li key={h.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => loadFromHistory(h.id)}
                onKeyDown={(e) => e.key === "Enter" && loadFromHistory(h.id)}
                className={cn(
                  "group btn-press w-full cursor-pointer rounded-xl border border-[var(--bd-soft)] bg-[var(--bg-panel)] px-2.5 py-2 text-left hover:border-[var(--bd-line)] transition-all",
                  h.id === mapId &&
                    "border-amber-500/60 bg-amber-500/10 shadow-xs"
                )}
              >
                <div className="flex items-start gap-2">
                  <MapIcon
                    size={14}
                    className={cn(
                      "mt-0.5 shrink-0",
                      h.id === mapId
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-[var(--tx-faint)]"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold text-[var(--tx-ink)]">
                      {h.name}
                    </p>
                    <p className="truncate font-mono text-[10px] text-[var(--tx-faint)]">
                      {h.pdfName || "ডকুমেন্ট"} • {timeAgo(h.createdAt)}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-[var(--tx-mut)]">
                      {bn(h.nodes.length)} নোড • {bn(h.edges.length)} সংযোগ
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFromHistory(h.id);
                    }}
                    title="মুছুন"
                    className="btn-press mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--tx-faint)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--danger)]/12 hover:text-[var(--danger)]"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
