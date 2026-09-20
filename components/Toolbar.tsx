"use client";

import { useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  Maximize2,
  ArrowRight,
  ArrowDown,
  Plus,
  Link2,
  Trash2,
  Download,
  Upload,
  Save,
  Eraser,
  Image as ImageIcon,
  FileCode2,
  FileJson2,
  Sparkles,
} from "lucide-react";

import { useAppStore } from "@/store/useAppStore";
import { exportPNG, exportSVG, exportJSON } from "@/lib/exportUtils";
import { KIND_META } from "./nodes/MindNode";
import { bn } from "@/lib/format";
import { cn } from "@/lib/utils";

function TBtn({
  id,
  title,
  onClick,
  active,
  disabled,
  children,
  danger,
}: {
  id?: string;
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      id={id}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "btn-press flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--bd-line)] bg-[var(--bg-panel)] text-[var(--tx-mut)]",
        "hover:bg-[var(--bg-panel2)] hover:text-[var(--tx-ink)] disabled:pointer-events-none disabled:opacity-35",
        active && "border-amber-500/70 bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold",
        danger &&
          "hover:border-[var(--danger)]/50 hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
      )}
    >
      {children}
    </button>
  );
}

const Div = () => <span className="mx-0.5 h-5 w-px bg-[var(--bd-line)]" />;

export default function Toolbar() {
  const { fitView } = useReactFlow();
  const [menu, setMenu] = useState<"add" | "export" | null>(null);

  const direction = useAppStore((s) => s.direction);
  const setDirection = useAppStore((s) => s.setDirection);
  const connectMode = useAppStore((s) => s.connectMode);
  const setConnectMode = useAppStore((s) => s.setConnectMode);
  const addNode = useAppStore((s) => s.addNode);
  const deleteSelected = useAppStore((s) => s.deleteSelected);
  const clearMap = useAppStore((s) => s.clearMap);
  const saveMapToHistory = useAppStore((s) => s.saveMapToHistory);
  const importMapText = useAppStore((s) => s.importMapText);
  const toast = useAppStore((s) => s.toast);
  const nodes = useAppStore((s) => s.nodes);
  const edges = useAppStore((s) => s.edges);
  const mapName = useAppStore((s) => s.mapName);
  const setSampleModalOpen = useAppStore((s) => s.setSampleModalOpen);

  const fileRef = useRef<HTMLInputElement>(null);

  const hasSelection =
    nodes.some((n) => n.selected) || edges.some((e) => e.selected);

  const baseName = (ext: string) =>
    `${(mapName || "mind-map")
      .replace(/[\\/:*?"<>|]/g, "")
      .trim()
      .slice(0, 40) || "mind-map"}.${ext}`;

  const pageBg = () =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--bg-app")
      .trim() || "#0c120f";

  const runExport = async (kind: "png" | "svg" | "json") => {
    setMenu(null);
    try {
      if (kind === "png") await exportPNG(baseName("png"), pageBg());
      if (kind === "svg") await exportSVG(baseName("svg"), pageBg());
      if (kind === "json")
        exportJSON(baseName("json"), {
          app: "sutra",
          version: 1,
          exportedAt: new Date().toISOString(),
          name: mapName,
          direction,
          nodes,
          edges,
        });
      toast("success", `${kind.toUpperCase()} ফাইল ডাউনলোড সম্পন্ন হয়েছে`);
    } catch (e) {
      toast("error", `এক্সপোর্ট ব্যর্থ হয়েছে: ${String((e as Error)?.message || e)}`);
    }
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      importMapText(await f.text());
    } catch {
      toast("error", "ফাইলটি পড়া সম্ভব হয়নি");
    }
  };

  const addKinds = Object.entries(KIND_META).filter(([k]) => k !== "root");

  return (
    <div className="anim-rise absolute top-3 left-3 z-20 flex items-center gap-1 rounded-xl border border-[var(--bd-line)] bg-[var(--bg-panel)]/95 p-1 shadow-lg backdrop-blur-md select-none">
      <TBtn
        id="toolbar-fit-btn"
        title="পুরো ম্যাপ স্ক্রিনে ফিট করুন"
        onClick={() => fitView({ padding: 0.16, duration: 450 })}
      >
        <Maximize2 size={15} />
      </TBtn>

      <TBtn
        id="toolbar-dir-btn"
        title={
          direction === "LR"
            ? "বাম→ডান লেআউট — ক্লিক করে উপর→নিচ করুন"
            : "উপর→নিচ লেআউট — ক্লিক করে বাম→ডান করুন"
        }
        onClick={() => setDirection(direction === "LR" ? "TB" : "LR")}
      >
        {direction === "LR" ? <ArrowRight size={15} /> : <ArrowDown size={15} />}
      </TBtn>

      <Div />

      {/* Add node dropdown */}
      <div className="relative">
        <TBtn
          id="toolbar-add-node-btn"
          title="নতুন নোড যুক্ত করুন"
          active={menu === "add"}
          onClick={() => setMenu(menu === "add" ? null : "add")}
        >
          <Plus size={16} />
        </TBtn>
        {menu === "add" && (
          <DropMenu onClose={() => setMenu(null)}>
            <div className="px-2.5 py-1 text-[10.5px] font-bold text-[var(--tx-faint)] uppercase tracking-wider">
              নোডের ধরন বাছুন
            </div>
            {addKinds.map(([key, m]) => {
              const Icon = m.icon;
              return (
                <MenuItem
                  key={key}
                  onClick={() => {
                    addNode(key);
                    setMenu(null);
                  }}
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-md"
                    style={{
                      background: `color-mix(in srgb, ${m.color} 18%, transparent)`,
                      color: m.color,
                    }}
                  >
                    <Icon size={12} />
                  </span>
                  <span>{m.label}</span>
                </MenuItem>
              );
            })}
          </DropMenu>
        )}
      </div>

      <TBtn
        id="toolbar-connect-btn"
        title="সংযোগ মোড — এক নোড থেকে অন্য নোডে তার টানুন"
        active={connectMode}
        onClick={() => setConnectMode(!connectMode)}
      >
        <Link2 size={15} />
      </TBtn>

      <TBtn
        id="toolbar-delete-btn"
        title="নির্বাচিত উপাদান মুছুন (Delete কী)"
        danger
        disabled={!hasSelection}
        onClick={deleteSelected}
      >
        <Trash2 size={15} />
      </TBtn>

      <Div />

      {/* Export dropdown */}
      <div className="relative">
        <TBtn
          id="toolbar-export-btn"
          title="এক্সপোর্ট (PNG, SVG, JSON)"
          active={menu === "export"}
          onClick={() => setMenu(menu === "export" ? null : "export")}
        >
          <Download size={15} />
        </TBtn>
        {menu === "export" && (
          <DropMenu onClose={() => setMenu(null)}>
            <MenuItem onClick={() => runExport("png")}>
              <ImageIcon size={13} className="text-[var(--tx-mut)]" />
              <span>PNG চিত্র</span>
            </MenuItem>
            <MenuItem onClick={() => runExport("svg")}>
              <FileCode2 size={13} className="text-[var(--tx-mut)]" />
              <span>SVG ভেক্টর</span>
            </MenuItem>
            <MenuItem onClick={() => runExport("json")}>
              <FileJson2 size={13} className="text-[var(--tx-mut)]" />
              <span>JSON ডেটা (পুনরায় এডিটযোগ্য)</span>
            </MenuItem>
          </DropMenu>
        )}
      </div>

      <TBtn
        id="toolbar-import-btn"
        title="JSON ম্যাপ ফাইল ইমপোর্ট করুন"
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={15} />
      </TBtn>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={onImportFile}
      />

      <TBtn
        id="toolbar-save-btn"
        title="হিস্ট্রিতে সেভ করুন"
        onClick={() => {
          saveMapToHistory();
          toast("success", "ম্যাপটি হিস্ট্রিতে সেভ হয়েছে");
        }}
      >
        <Save size={15} />
      </TBtn>

      <TBtn
        id="toolbar-clear-btn"
        title="ক্যানভাস পরিষ্কার করুন"
        danger
        onClick={() => {
          clearMap();
          toast("info", "ক্যানভাস পরিষ্কার করা হয়েছে");
        }}
      >
        <Eraser size={15} />
      </TBtn>

      <TBtn
        id="toolbar-samples-btn"
        title="তৈরি করা ডেমো কালরেখা পরখ করুন"
        onClick={() => setSampleModalOpen(true)}
      >
        <Sparkles size={15} className="text-amber-600 dark:text-amber-400" />
      </TBtn>

      {hasSelection && (
        <span className="ml-1 pr-1.5 font-mono text-[10px] text-[var(--tx-faint)]">
          {bn(
            nodes.filter((n) => n.selected).length +
              edges.filter((e) => e.selected).length
          )}{" "}
          সিলেক্টেড
        </span>
      )}
    </div>
  );
}

function DropMenu({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="anim-pop absolute top-10 left-0 z-40 min-w-[200px] overflow-hidden rounded-xl border border-[var(--bd-line)] bg-[var(--bg-panel)] p-1 shadow-xl">
        {children}
      </div>
    </>
  );
}

function MenuItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-semibold text-[var(--tx-ink)] transition-colors hover:bg-[var(--bg-panel2)]"
    >
      {children}
    </button>
  );
}
