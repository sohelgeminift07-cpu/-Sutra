"use client";

import { useEffect, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ConnectionMode,
  MarkerType,
  useReactFlow,
  DefaultEdgeOptions,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AlertTriangle,
  RefreshCw,
  Sparkles,
  BookOpenCheck,
  Calendar,
  Layers,
} from "lucide-react";

import MindNode, { KIND_META } from "./nodes/MindNode";
import Toolbar from "./Toolbar";
import { useAppStore } from "@/store/useAppStore";
import { bn, shortModel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FlowNode, FlowEdge } from "@/lib/layoutUtils";

const nodeTypes = { mindNode: MindNode };

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "default",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 14,
    height: 14,
    color: "var(--edge-c)",
  },
  labelStyle: { fill: "var(--tx-mut)", fontSize: 10.5, fontWeight: 600 },
  labelBgStyle: { fill: "var(--bg-app)", opacity: 0.94 },
  labelBgPadding: [5, 2],
  labelBgBorderRadius: 5,
};

/* Empty State component */
function EmptyState() {
  const setSampleModalOpen = useAppStore((s) => s.setSampleModalOpen);
  const pdfFile = useAppStore((s) => s.pdfFile);

  return (
    <div className="anim-rise pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6 overflow-auto">
      <div className="pointer-events-auto mx-auto grid w-full max-w-4xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--bd-line)] bg-[var(--bg-panel)] px-3.5 py-1 text-[11px] font-semibold text-[var(--tx-mut)] shadow-xs">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--ac)]" />
            জ্ঞান ও তথ্যের দৃষ্টিনন্দন ভিজ্যুয়াল ম্যাপিং
          </div>

          <h2 className="text-[32px] sm:text-[38px] leading-[1.15] font-extrabold text-[var(--tx-ink)] tracking-tight">
            যেকোনো PDF বা টেক্সট থেকে তৈরি করুন
            <span className="text-amber-600 dark:text-amber-400"> স্বয়ংক্রিয় কালরেখা ও মাইন্ড ম্যাপ</span>
          </h2>

          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[var(--tx-mut)]">
            বই, অধ্যায় বা যেকোনো নোটের টেক্সট বিশ্লেষণ করে মূল বিষয়, সাল/তারিখ, ঘটনা, চরিত্র, সিদ্ধান্ত এবং ফলাফল স্বয়ংক্রিয়ভাবে একটি আকর্ষণীয় ফ্লোচার্ট ও মাইন্ড ম্যাপে সাজিয়ে দেয়।
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              id="empty-demo-btn"
              onClick={() => setSampleModalOpen(true)}
              className="btn-press flex items-center gap-2 rounded-xl bg-[var(--ac)] px-4 py-2.5 text-[13px] font-bold text-[var(--ac-ink)] shadow-[0_4px_16px_rgba(240,178,62,0.3)] hover:shadow-[0_6px_22px_rgba(240,178,62,0.45)]"
            >
              <BookOpenCheck size={16} />
              ডেমো কালরেখা দেখুন (Instant)
            </button>

            {!pdfFile && (
              <span className="text-[12px] text-[var(--tx-faint)]">
                বা বাম পাশের প্যানেল থেকে PDF আপলোড অথবা সরাসরি টেক্সট পেস্ট করুন
              </span>
            )}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[var(--bd-soft)] pt-5">
            <div className="flex items-start gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--ac)]/15 text-amber-700 dark:text-amber-400">
                <Calendar size={14} />
              </span>
              <div>
                <p className="text-[12px] font-bold text-[var(--tx-ink)]">ধারাবাহিক কালরেখা</p>
                <p className="text-[10.5px] text-[var(--tx-faint)]">সাল অনুযায়ী হাব বিন্যাস</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Layers size={14} />
              </span>
              <div>
                <p className="text-[12px] font-bold text-[var(--tx-ink)]">বহুমাত্রিক নোড</p>
                <p className="text-[10.5px] text-[var(--tx-faint)]">ব্যক্তি, স্থান ও ফলাফল</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <Sparkles size={14} />
              </span>
              <div>
                <p className="text-[12px] font-bold text-[var(--tx-ink)]">সম্পূর্ণ এডিটেবল</p>
                <p className="text-[10.5px] text-[var(--tx-faint)]">ডাবল ক্লিকে এডিট ও এক্সপোর্ট</p>
              </div>
            </div>
          </div>
        </div>

        <EmptySketch />
      </div>
    </div>
  );
}

function EmptySketch() {
  return (
    <div className="anim-floaty hidden lg:block select-none">
      <svg viewBox="0 0 460 320" className="w-full max-w-[420px]" fill="none">
        <path
          className="dash-line"
          d="M140 160 C 180 160 180 75 220 75"
          stroke="var(--k-date)"
          strokeWidth="2"
        />
        <path
          className="dash-line"
          d="M140 160 L 220 160"
          stroke="var(--k-date)"
          strokeWidth="2"
        />
        <path
          className="dash-line"
          d="M140 160 C 180 160 180 245 220 245"
          stroke="var(--k-date)"
          strokeWidth="2"
        />
        <path
          className="dash-line"
          d="M320 75 C 350 75 350 45 380 45"
          stroke="var(--k-event)"
          strokeWidth="1.6"
        />
        <path
          className="dash-line"
          d="M320 75 C 350 75 350 105 380 105"
          stroke="var(--k-person)"
          strokeWidth="1.6"
        />
        <path
          className="dash-line"
          d="M320 160 L 380 160"
          stroke="var(--k-place)"
          strokeWidth="1.6"
        />
        <path
          className="dash-line"
          d="M320 245 C 350 245 350 220 380 220"
          stroke="var(--k-decision)"
          strokeWidth="1.6"
        />
        <path
          className="dash-line"
          d="M320 245 C 350 245 350 275 380 275"
          stroke="var(--k-outcome)"
          strokeWidth="1.6"
        />

        <rect x="20" y="130" width="120" height="60" rx="14" fill="var(--k-root)" />
        <text
          x="80"
          y="166"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="#241a04"
        >
          মূল বিষয়
        </text>

        {[
          { y: 50, c: "var(--k-date)", t: "১৯৫২ সাল" },
          { y: 135, c: "var(--k-date)", t: "১৯৬৬ সাল" },
          { y: 220, c: "var(--k-date)", t: "১৯৭১ সাল" },
        ].map((d) => (
          <g key={d.t}>
            <rect
              x="220"
              y={d.y}
              width="100"
              height="50"
              rx="12"
              fill="color-mix(in srgb, var(--k-date) 14%, var(--bg-raise))"
              stroke={d.c}
              strokeWidth="1.6"
            />
            <circle cx="240" cy={d.y + 25} r="6.5" fill={d.c} opacity="0.85" />
            <text
              x="256"
              y={d.y + 30}
              fontSize="12.5"
              fontWeight="600"
              fill="var(--tx-ink)"
            >
              {d.t}
            </text>
          </g>
        ))}

        {[
          { y: 25, c: "var(--k-event)", t: "ঘটনা" },
          { y: 85, c: "var(--k-person)", t: "চরিত্র" },
          { y: 140, c: "var(--k-place)", t: "স্থান" },
          { y: 200, c: "var(--k-decision)", t: "সিদ্ধান্ত" },
          { y: 255, c: "var(--k-outcome)", t: "ফলাফল" },
        ].map((l) => (
          <g key={l.t + l.y}>
            <rect
              x="380"
              y={l.y}
              width="74"
              height="40"
              rx="10"
              fill="color-mix(in srgb, var(--bg-raise) 70%, transparent)"
              stroke={l.c}
              strokeWidth="1.4"
            />
            <circle cx="396" cy={l.y + 20} r="5" fill={l.c} opacity="0.85" />
            <text
              x="408"
              y={l.y + 24}
              fontSize="11"
              fontWeight="600"
              fill="var(--tx-mut)"
            >
              {l.t}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* Loading Overlay */
function LoadingOverlay() {
  const progressMsg = useAppStore((s) => s.progressMsg);
  const progressSec = useAppStore((s) => s.progressSec);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[var(--bg-app)]/85 backdrop-blur-[4px] select-none">
      <svg viewBox="0 0 320 120" className="w-[280px]" fill="none">
        <path className="dash-line" d="M70 60 L 130 32" stroke="var(--k-date)" strokeWidth="2" />
        <path className="dash-line" d="M70 60 L 130 60" stroke="var(--k-person)" strokeWidth="2" />
        <path className="dash-line" d="M70 60 L 130 88" stroke="var(--k-place)" strokeWidth="2" />
        <path className="dash-line" d="M150 32 L 225 22" stroke="var(--k-event)" strokeWidth="1.6" />
        <path className="dash-line" d="M150 88 L 225 98" stroke="var(--k-outcome)" strokeWidth="1.6" />
        <circle cx="52" cy="60" r="18" fill="var(--k-root)" opacity="0.95" />
        <circle cx="140" cy="32" r="11" fill="var(--k-date)" className="pulse-dot" />
        <circle cx="140" cy="60" r="11" fill="var(--k-person)" className="pulse-dot" style={{ animationDelay: "0.3s" }} />
        <circle cx="140" cy="88" r="11" fill="var(--k-place)" className="pulse-dot" style={{ animationDelay: "0.6s" }} />
        <circle cx="235" cy="22" r="8" fill="var(--k-event)" className="pulse-dot" style={{ animationDelay: "0.9s" }} />
        <circle cx="235" cy="98" r="8" fill="var(--k-outcome)" className="pulse-dot" style={{ animationDelay: "1.2s" }} />
      </svg>
      <p className="mt-4 text-[17px] font-bold text-[var(--tx-ink)] text-center px-4">
        {progressMsg}
      </p>
      <p className="mt-1 font-mono text-[11px] text-[var(--tx-mut)]">
        {bn(progressSec)} সেকেন্ড সময় নিচ্ছে
      </p>
      <div className="shimmer-bar mt-4 w-56" />
      <p className="mt-4 max-w-sm px-6 text-center text-[11.5px] leading-relaxed text-[var(--tx-faint)]">
        ডকুমেন্টের জটিলতা অনুযায়ী ১০–৪৫ সেকেন্ড লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন…
      </p>
    </div>
  );
}

/* Error Banner */
function ErrorBanner() {
  const error = useAppStore((s) => s.error);
  const generate = useAppStore((s) => s.generate);
  if (!error) return null;

  return (
    <div className="anim-pop absolute top-16 left-1/2 z-20 w-[min(560px,92%)] -translate-x-1/2">
      <div className="flex items-start gap-3 rounded-xl border border-[var(--danger)]/50 bg-[var(--bg-panel)] px-4 py-3 shadow-lg">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--danger)]" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-relaxed font-semibold text-[var(--tx-ink)]">{error}</p>
        </div>
        <button
          id="retry-generate-btn"
          onClick={() => generate()}
          className="btn-press flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--danger)] px-3 py-1.5 text-[12px] font-bold text-white shadow-xs"
        >
          <RefreshCw size={13} /> পুনরায় চেষ্টা
        </button>
      </div>
    </div>
  );
}

/* Legend */
function Legend() {
  return (
    <div className="hidden lg:flex items-center gap-2.5 overflow-hidden">
      {Object.entries(KIND_META).map(([key, m]) => (
        <span key={key} className="flex items-center gap-1 text-[10.5px] font-medium text-[var(--tx-mut)] whitespace-nowrap">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: m.color }} />
          {m.label}
        </span>
      ))}
    </div>
  );
}

function CanvasInner() {
  const nodes = useAppStore((s) => s.nodes);
  const edges = useAppStore((s) => s.edges);
  const direction = useAppStore((s) => s.direction);
  const connectMode = useAppStore((s) => s.connectMode);
  const generating = useAppStore((s) => s.generating);
  const mapVersion = useAppStore((s) => s.mapVersion);
  const onNodesChange = useAppStore((s) => s.onNodesChange);
  const onEdgesChange = useAppStore((s) => s.onEdgesChange);
  const connectNodes = useAppStore((s) => s.connectNodes);
  const mapName = useAppStore((s) => s.mapName);
  const model = useAppStore((s) => s.model);
  const { fitView } = useReactFlow();
  const didInitialFit = useRef(false);

  useEffect(() => {
    if (mapVersion === 0) return;
    const t = setTimeout(() => fitView({ padding: 0.16, duration: 450 }), 100);
    return () => clearTimeout(t);
  }, [mapVersion, fitView]);

  useEffect(() => {
    if (!didInitialFit.current) {
      didInitialFit.current = true;
      if (useAppStore.getState().nodes.length) {
        setTimeout(() => fitView({ padding: 0.16 }), 150);
      }
    }
  }, [fitView]);

  return (
    <div className="flex h-full min-h-0 flex-col relative overflow-hidden">
      <div className={cn("canvas-ambient relative min-h-0 flex-1", connectMode && "connect-on")}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(c) => connectMode && connectNodes(c)}
          nodesConnectable={connectMode}
          connectionMode={ConnectionMode.Loose}
          proOptions={{ hideAttribution: true }}
          minZoom={0.06}
          maxZoom={2.4}
          fitView
          deleteKeyCode={["Backspace", "Delete"]}
          nodesDraggable
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="var(--bd-line)" />
          <Controls position="bottom-left" showInteractive={false} />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={(n) => {
              const k = (n?.data?.kind as string) || "event";
              return KIND_META[k]?.color || "var(--edge-c)";
            }}
            maskColor="color-mix(in srgb, var(--bg-app) 78%, transparent)"
            style={{ width: 160, height: 110 }}
          />
        </ReactFlow>

        {nodes.length > 0 && !generating && <Toolbar />}
        {nodes.length === 0 && !generating && <EmptyState />}
        {generating && <LoadingOverlay />}
        <ErrorBanner />

        {connectMode && !generating && (
          <div className="anim-pop absolute top-16 right-3 z-20 rounded-lg border border-amber-500/60 bg-amber-500/15 px-3 py-1.5 text-[11.5px] font-semibold text-amber-800 dark:text-amber-300 backdrop-blur-md shadow-xs">
            সংযোগ মোড চালু — এক নোডের সংযোগ বিন্দু থেকে অন্য নোডে টেনে যুক্ত করুন
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="flex h-9 shrink-0 items-center gap-4 overflow-hidden border-t border-[var(--bd-line)] bg-[var(--bg-panel)] px-4 text-[11px] text-[var(--tx-mut)] select-none">
        <span className="flex shrink-0 items-center gap-1.5 font-medium">
          <span className="font-mono font-bold text-[var(--tx-ink)]">{bn(nodes.length)}</span> নোড
          <span className="text-[var(--tx-faint)]">•</span>
          <span className="font-mono font-bold text-[var(--tx-ink)]">{bn(edges.length)}</span> সংযোগ
        </span>

        <span className="shrink-0 rounded-md border border-[var(--bd-line)] bg-[var(--bg-panel2)] px-2 py-0.5 font-mono text-[10px] font-semibold">
          লেআউট: {direction === "LR" ? "বাম→ডান" : "উপর→নিচ"}
        </span>

        <div className="min-w-0 flex-1">
          <Legend />
        </div>

        {mapName && (
          <span className="hidden max-w-[200px] truncate font-semibold text-[var(--tx-ink)] sm:block" title={mapName}>
            {mapName}
          </span>
        )}

        <span className="hidden shrink-0 font-mono text-[10.5px] text-[var(--tx-faint)] md:block">
          {shortModel(model)}
        </span>
      </div>
    </div>
  );
}

export default function MindMapCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
