"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Handle, Position, NodeProps, useUpdateNodeInternals } from "@xyflow/react";
import {
  Sparkles,
  Calendar,
  Swords,
  User,
  MapPin,
  Scale,
  FileText,
  Target,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight,
  ArrowDownLeft,
  LucideIcon,
  HelpCircle,
  Info,
  Plus,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { sizeFor } from "@/lib/layoutUtils";
import { cn } from "@/lib/utils";

export interface NodeMeta {
  icon: LucideIcon;
  label: string;
  color: string;
}

export const KIND_META: Record<string, NodeMeta> = {
  root: { icon: Sparkles, label: "মূল বিষয়", color: "var(--k-root)" },
  date: { icon: Calendar, label: "তারিখ/সাল", color: "var(--k-date)" },
  event: { icon: Swords, label: "ঘটনা", color: "var(--k-event)" },
  person: { icon: User, label: "ব্যক্তি", color: "var(--k-person)" },
  place: { icon: MapPin, label: "স্থান", color: "var(--k-place)" },
  decision: { icon: Scale, label: "সিদ্ধান্ত", color: "var(--k-decision)" },
  document: { icon: FileText, label: "নথি/দলিল", color: "var(--k-document)" },
  outcome: { icon: Target, label: "ফলাফল", color: "var(--k-outcome)" },
  subnode: { icon: Info, label: "বাড়তি তথ্য", color: "var(--k-subnode)" },
};

interface MindNodeData {
  label: string;
  kind?: string;
  date?: string | null;
  detail?: string | null;
  sourceContext?: string | null;
  [key: string]: unknown;
}

function MindNodeInner({ id, data, selected }: NodeProps) {
  const nodeData = data as MindNodeData;
  const updateNodeLabel = useAppStore((s) => s.updateNodeLabel);
  const addSubNode = useAppStore((s) => s.addSubNode);

  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nodeData.label || "");

  const inputRef = useRef<HTMLInputElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();

  const kind = (nodeData.kind as string) || "event";
  const meta = KIND_META[kind] || KIND_META.event;
  const Icon = meta.icon;
  const size = sizeFor(kind);
  const isRoot = kind === "root";
  const isSubnode = kind === "subnode";

  // Notify React Flow whenever expanded changes so edges stay cleanly aligned
  useEffect(() => {
    updateNodeInternals(id);
  }, [expanded, updateNodeInternals, id]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const val = draft.trim();
    if (val) updateNodeLabel(id, val.slice(0, 160));
    setEditing(false);
  };

  // Find incoming & outgoing edges for contextual trail
  const getConnections = () => {
    const state = useAppStore.getState();
    const incoming = state.edges
      .filter((e) => e.target === id)
      .map((e) => {
        const src = state.nodes.find((n) => n.id === e.source);
        return {
          id: e.id,
          label: e.label,
          nodeLabel: src?.data?.label || "পূর্ববর্তী নোড",
          kind: (src?.data?.kind as string) || "event",
        };
      });

    const outgoing = state.edges
      .filter((e) => e.source === id)
      .map((e) => {
        const tgt = state.nodes.find((n) => n.id === e.target);
        return {
          id: e.id,
          label: e.label,
          nodeLabel: tgt?.data?.label || "পরবর্তী নোড",
          kind: (tgt?.data?.kind as string) || "event",
        };
      });

    return { incoming, outgoing };
  };

  const { incoming, outgoing } = expanded ? getConnections() : { incoming: [], outgoing: [] };

  return (
    <div
      style={
        {
          width: expanded ? (isSubnode ? Math.max(size.width, 280) : Math.max(size.width, 330)) : size.width,
          "--k": meta.color,
        } as React.CSSProperties
      }
      className={cn(
        "mm-node transition-all duration-200 select-none relative",
        isSubnode ? "is-subnode p-2" : "p-3",
        selected && "is-selected ring-2 ring-amber-500/70",
        isRoot && "is-root font-semibold shadow-md",
        editing && "is-editing",
        expanded ? "is-expanded shadow-2xl ring-2 ring-[var(--k)]/60 bg-[var(--bg-raise)]" : "hover:border-[var(--k)]/80"
      )}
      onClick={(e) => {
        if (editing) return;
        // Single click expands/collapses the node downwards in place
        setExpanded((prev) => !prev);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setDraft(nodeData.label);
        setEditing(true);
      }}
      title={expanded ? undefined : (nodeData.detail || "ক্লিক করে বিস্তারিত দেখুন")}
    >
      {/* Handles for seamless LR and TB layout routing — anchored to header top */}
      <Handle
        type="target"
        position={Position.Left}
        id="t-left"
        style={{ top: isSubnode ? 16 : 22 }}
        className="!border-background !bg-amber-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="s-right"
        style={{ top: isSubnode ? 16 : 22 }}
        className="!border-background !bg-amber-500"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="t-top"
        className="!border-background !bg-amber-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="s-bottom"
        className="!border-background !bg-amber-500"
      />

      {/* Node Header Row */}
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mm-icon-chip flex shrink-0 items-center justify-center rounded-lg shadow-xs transition-transform",
            isSubnode ? "h-5 w-5 rounded-md mt-0.5" : "h-7 w-7",
            isRoot && "mt-0.5 h-8 w-8",
            expanded && "scale-105"
          )}
        >
          <Icon size={isRoot ? 18 : isSubnode ? 11 : 14} strokeWidth={2.2} />
        </span>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditing(false);
              }}
              className="nodrag w-full rounded-md border border-amber-500/80 bg-background/90 px-1.5 py-0.5 text-[11px] font-medium text-foreground outline-none ring-1 ring-amber-500"
            />
          ) : (
            <p
              className={cn(
                "leading-snug break-words transition-colors",
                isRoot
                  ? "text-[14px] font-bold text-amber-950 dark:text-amber-950"
                  : isSubnode
                  ? "text-[11px] font-semibold text-[var(--tx-ink)]"
                  : "text-[12.5px] font-bold text-[var(--tx-ink)]"
              )}
              style={
                expanded
                  ? undefined
                  : {
                      display: "-webkit-box",
                      WebkitLineClamp: isSubnode ? 2 : 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }
              }
            >
              {nodeData.label}
            </p>
          )}

          {kind === "date" && nodeData.date && nodeData.date !== nodeData.label && (
            <p className="mt-0.5 truncate font-mono text-[10.5px] font-medium opacity-85">
              {nodeData.date}
            </p>
          )}

          {/* Compact summary preview when collapsed (for non-subnodes) */}
          {!expanded && nodeData.detail && !isSubnode && !editing && (
            <p
              className={cn(
                "mt-0.5 text-[10.5px] leading-snug line-clamp-2",
                isRoot ? "text-amber-900/80" : "text-[var(--tx-mut)]"
              )}
            >
              {nodeData.detail}
            </p>
          )}
        </div>

        {/* Expand / Collapse toggle icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!editing) setExpanded((v) => !v);
          }}
          className={cn(
            "btn-press -mr-0.5 -mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[var(--tx-mut)] transition-colors hover:bg-black/10 dark:hover:bg-white/10 hover:text-[var(--tx-ink)]",
            expanded && "bg-black/10 dark:bg-white/10 text-[var(--tx-ink)]"
          )}
          title={expanded ? "সংকুচিত করুন" : "নিচে বিস্তারিত দেখুন"}
        >
          {expanded ? <ChevronUp size={isSubnode ? 12 : 14} /> : <ChevronDown size={isSubnode ? 12 : 14} />}
        </button>
      </div>

      {/* Meta Chips Bar (Collapsed or Expanded) */}
      <div className={cn("flex items-center justify-between border-t border-[var(--bd-line)]/50 pt-1", isSubnode ? "mt-1.5" : "mt-2 pt-1.5")}>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "mm-kind-chip rounded-full px-1.5 py-[1px] font-semibold",
              isSubnode ? "text-[8.5px] bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30" : "text-[9.5px]",
              isRoot && "border-transparent bg-black/15 text-amber-950"
            )}
          >
            {isSubnode ? "তথ্যকণিকা" : meta.label}
          </span>
          {nodeData.date && kind !== "date" && (
            <span className="rounded-full bg-[var(--bd-line)]/40 px-1.5 py-[1px] font-mono text-[9px] text-[var(--tx-mut)]">
              {nodeData.date}
            </span>
          )}
        </div>

        {!expanded ? (
          <span className="flex items-center gap-0.5 text-[9px] font-medium text-[var(--tx-faint)] group-hover:text-amber-600 transition-colors">
            <span>{isSubnode ? "নোট" : "বিস্তারিত"}</span>
            <ChevronDown size={10} />
          </span>
        ) : (
          <span className="flex items-center gap-0.5 text-[9px] font-medium text-amber-600 transition-colors">
            <span>সংক্ষেপ</span>
            <ChevronUp size={10} />
          </span>
        )}
      </div>

      {/* ----------------- EXPANDED DOWNWARDS SECTION ----------------- */}
      {expanded && (
        <div
          className="mt-2 space-y-2 border-t border-[var(--bd-line)] pt-2 text-left anim-rise nodrag"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Source Context Heading */}
          <div className="flex items-center gap-1.5 rounded-lg bg-[var(--k)]/10 px-2 py-1 text-[var(--k)]">
            <BookOpen size={12} className="shrink-0" />
            <span className="text-[10.5px] font-bold">
              {isSubnode ? "তথ্যকণিকার পূর্ণ বিবরণ" : "মেইন সোর্সের আলোকে বিস্তারিত তথ্য"}
            </span>
          </div>

          {/* Detailed Content in Natural Human Language - Immediately available */}
          <div className="rounded-xl border border-[var(--bd-line)] bg-[var(--bg-panel2)] p-2 text-[11.5px] leading-relaxed text-[var(--tx-ink)]">
            {nodeData.sourceContext ? (
              <p className="whitespace-pre-line text-[11px] leading-relaxed">
                {nodeData.sourceContext}
              </p>
            ) : nodeData.detail ? (
              <p className="whitespace-pre-line text-[11px] leading-relaxed">
                {nodeData.detail}
              </p>
            ) : (
              <p className="text-[10.5px] text-[var(--tx-mut)]">
                এই নোডটির প্রাথমিক তথ্য সংরক্ষিত রয়েছে।
              </p>
            )}
          </div>

          {/* Chronological Connections Trail (Incoming & Outgoing nodes) */}
          {(incoming.length > 0 || outgoing.length > 0) && (
            <div className="space-y-1.5 rounded-xl border border-[var(--bd-line)]/70 bg-[var(--bg-panel)] p-2 text-[10.5px]">
              <p className="text-[9.5px] font-bold text-[var(--tx-mut)] uppercase tracking-wider">
                কালানুক্রমিক কার্যকারণ ও সংযোগ:
              </p>

              {incoming.map((inc) => (
                <div key={inc.id} className="flex items-center gap-1.5 text-[10px]">
                  <ArrowDownLeft size={11} className="text-emerald-500 shrink-0" />
                  <span className="text-[var(--tx-faint)]">উৎস:</span>
                  <span className="font-medium text-[var(--tx-ink)] truncate">{inc.nodeLabel}</span>
                  {inc.label && (
                    <span className="rounded bg-emerald-500/10 px-1 py-0.2 text-[8.5px] text-emerald-700 dark:text-emerald-300">
                      {inc.label}
                    </span>
                  )}
                </div>
              ))}

              {outgoing.map((out) => (
                <div key={out.id} className="flex items-center gap-1.5 text-[10px]">
                  <ArrowRight size={11} className="text-sky-500 shrink-0" />
                  <span className="text-[var(--tx-faint)]">ফলাফল:</span>
                  <span className="font-medium text-[var(--tx-ink)] truncate">{out.nodeLabel}</span>
                  {out.label && (
                    <span className="rounded bg-sky-500/10 px-1 py-0.2 text-[8.5px] text-sky-700 dark:text-sky-300">
                      {out.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Bottom Card Actions: Add subnode button + Rename hint & Collapse button */}
          <div className="flex items-center justify-between pt-1 gap-2">
            {!isSubnode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addSubNode(id);
                }}
                className="btn-press flex items-center gap-1 rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-500/20"
                title="এই নোডের সাথে সংযুক্ত একটি ছোট বাড়তি তথ্য বক্স যোগ করুন"
              >
                <Plus size={11} />
                <span>+ বাড়তি তথ্য</span>
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-[9px] text-[var(--tx-faint)] hidden sm:flex items-center gap-0.5">
                <HelpCircle size={9} />
                <span>ডাবল ক্লিকে এডিট</span>
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(false);
                }}
                className="btn-press flex items-center gap-1 rounded-md border border-[var(--bd-line)] bg-[var(--bg-panel)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--tx-mut)] hover:text-[var(--tx-ink)] hover:bg-[var(--bg-panel2)]"
              >
                <ChevronUp size={11} />
                <span>সংকুচিত</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(MindNodeInner);
