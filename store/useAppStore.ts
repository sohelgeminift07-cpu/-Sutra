import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as rfAddEdge,
  NodeChange,
  EdgeChange,
  Connection,
} from "@xyflow/react";
import { applyLayout, FlowNode, FlowEdge } from "../lib/layoutUtils";
import { sanitizeMindMap, toFlowGraph, NODE_KINDS, NodeKind } from "../lib/mapUtils";
import { parseMapJSON } from "../lib/exportUtils";
import { getPdfMeta, renderThumbnails, extractPages, blobToBase64, parsePageSelection, ThumbnailItem } from "../lib/pdfUtils";
import { bn } from "../lib/format";
import { SAMPLE_MAPS } from "../lib/sampleMaps";

export interface HistoryItem {
  id: string;
  name: string;
  createdAt: number;
  pdfName?: string;
  direction?: "LR" | "TB";
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface ToastItem {
  id: string;
  kind: "success" | "error" | "info";
  msg: string;
}

export interface ModelItem {
  name: string;
  displayName: string;
}

const PROGRESS_MESSAGES = [
  "PDF ফাইল প্রস্তুত করা হচ্ছে…",
  "Gemini AI ডকুমেন্ট পর্যালোচনা করছে…",
  "ঐতিহাসিক সাল ও কালরেখা নির্ণয় হচ্ছে…",
  "ঘটনা, চরিত্র ও স্থানসমূহ চিহ্নিত হচ্ছে…",
  "শাখা-প্রশাখার পারস্পরিক কার্যকারণ সম্পর্ক নির্ধারণ হচ্ছে…",
  "মাইন্ড ম্যাপ ও ফ্লোচার্ট লেআউট সাজানো হচ্ছে…",
];

const uid = () => Math.random().toString(36).slice(2, 9);

let msgTimer: NodeJS.Timeout | null = null;
let secTimer: NodeJS.Timeout | null = null;

interface AppState {
  // Settings & Status
  apiKey: string;
  hasServerKey: boolean;
  model: string;
  models: ModelItem[];
  modelsLoading: boolean;
  modelsError: string | null;
  theme: "dark" | "light";
  sidebarOpen: boolean;
  settingsOpen: boolean;
  sampleModalOpen: boolean;

  // PDF State
  pdfFile: File | null;
  pdfName: string;
  pdfSize: number;
  pageCount: number;
  thumbnails: ThumbnailItem[];
  thumbsLoading: boolean;

  // Selection
  selectionMode: "all" | "custom";
  selectedPages: number[];

  // Input Mode (PDF vs Direct Text)
  inputMode: "pdf" | "text";
  pastedText: string;
  setInputMode: (mode: "pdf" | "text") => void;
  setPastedText: (text: string) => void;
  clearPastedText: () => void;

  // Mind Map
  nodes: FlowNode[];
  edges: FlowEdge[];
  direction: "LR" | "TB";
  mapName: string;
  mapMeta: { pdfName?: string; pages?: number; model?: string } | null;
  mapId: string | null;
  mapVersion: number;
  generating: boolean;
  progressMsg: string;
  progressSec: number;
  error: string | null;
  connectMode: boolean;

  // History & Toasts
  history: HistoryItem[];
  toasts: ToastItem[];

  // Actions
  toast: (kind: "success" | "error" | "info", msg: string) => void;
  dismissToast: (id: string) => void;
  toggleTheme: () => void;
  setSidebarOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setSampleModalOpen: (v: boolean) => void;
  saveApiKey: (key: string) => Promise<void>;
  clearApiKey: () => void;
  fetchModels: (overrideKey?: string) => Promise<void>;
  setModel: (m: string) => void;

  // PDF Actions
  loadPdf: (file: File) => Promise<void>;
  clearPdf: () => void;
  setSelectionMode: (mode: "all" | "custom") => void;
  togglePage: (page: number) => void;
  applyRange: (rangeStr: string) => void;
  selectAllThumbs: () => void;
  clearSelection: () => void;

  // Canvas Actions
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  connectNodes: (connection: Connection) => void;
  updateNodeLabel: (id: string, label: string) => void;
  updateNodeData: (id: string, partialData: Record<string, unknown>) => void;
  addNode: (kind: NodeKind | string) => void;
  addSubNode: (parentId: string, label?: string) => void;
  deleteSelected: () => void;
  setConnectMode: (v: boolean) => void;
  relayout: () => void;
  setDirection: (d: "LR" | "TB") => void;
  clearMap: () => void;
  loadSampleMap: (id: string) => void;

  // Generation
  generate: () => Promise<void>;

  // History
  saveMapToHistory: () => void;
  loadFromHistory: (id: string) => void;
  deleteFromHistory: (id: string) => void;
  clearHistory: () => void;

  // Import
  importMapText: (text: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      apiKey: "",
      hasServerKey: true,
      model: "gemini-3.8-flash",
      models: [
        { name: "gemini-3.8-flash", displayName: "Gemini 3.8 Flash (ডিফল্ট, উচ্চ গতি ও নির্ভরযোগ্য)" },
        { name: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash (স্থিতিশীল)" },
        { name: "gemini-3.1-pro-preview", displayName: "Gemini 3.1 Pro Preview (গভীর বিশ্লেষণ)" },
        { name: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro" },
      ],
      modelsLoading: false,
      modelsError: null,
      theme: "dark",
      sidebarOpen: true,
      settingsOpen: false,
      sampleModalOpen: false,

      pdfFile: null,
      pdfName: "",
      pdfSize: 0,
      pageCount: 0,
      thumbnails: [],
      thumbsLoading: false,

      selectionMode: "all",
      selectedPages: [],

      inputMode: "pdf",
      pastedText: "",
      setInputMode: (mode) => set({ inputMode: mode }),
      setPastedText: (text) => set({ pastedText: text }),
      clearPastedText: () => set({ pastedText: "" }),

      nodes: [],
      edges: [],
      direction: "LR",
      mapName: "",
      mapMeta: null,
      mapId: null,
      mapVersion: 0,
      generating: false,
      progressMsg: "",
      progressSec: 0,
      error: null,
      connectMode: false,

      history: [],
      toasts: [],

      toast: (kind, msg) => {
        const id = `t_${uid()}`;
        set((s) => ({ toasts: [...s.toasts.slice(-3), { id, kind, msg }] }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 4500);
      },

      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      toggleTheme: () =>
        set((s) => {
          const next = s.theme === "dark" ? "light" : "dark";
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", next === "dark");
          }
          return { theme: next };
        }),

      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      setSettingsOpen: (v) => set({ settingsOpen: v }),
      setSampleModalOpen: (v) => set({ sampleModalOpen: v }),

      saveApiKey: async (key) => {
        const clean = key.trim();
        set({ apiKey: clean });
        await get().fetchModels(clean);
      },

      clearApiKey: () => {
        set({ apiKey: "" });
        get().fetchModels("");
      },

      fetchModels: async (overrideKey) => {
        set({ modelsLoading: true, modelsError: null });
        try {
          const keyToUse = overrideKey !== undefined ? overrideKey : get().apiKey;
          const headers: HeadersInit = {};
          if (keyToUse) headers["x-gemini-key"] = keyToUse;

          const res = await fetch("/api/gemini/models", { headers });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          if (data.models && Array.isArray(data.models)) {
            set({
              models: data.models,
              hasServerKey: Boolean(data.hasServerKey || data.hasKey),
              modelsLoading: false,
            });
            const current = get().model;
            if (!data.models.some((m: ModelItem) => m.name === current)) {
              set({ model: data.models[0]?.name || "gemini-3.8-flash" });
            }
          } else {
            set({ modelsLoading: false });
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "মডেল তালিকা লোড করা যায়নি";
          set({
            modelsLoading: false,
            modelsError: message,
          });
        }
      },

      setModel: (m) => set({ model: m }),

      loadPdf: async (file) => {
        if (!file) return;
        const isPdf =
          file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
        if (!isPdf) {
          get().toast("error", "শুধুমাত্র PDF ফাইল আপলোড করা যাবে।");
          return;
        }

        if (file.size > 80 * 1024 * 1024) {
          get().toast("error", "ফাইলটি ৮০MB এর চেয়ে বড়। ছোট ফাইল চেষ্টা করুন।");
          return;
        }

        set({
          pdfFile: file,
          pdfName: file.name,
          pdfSize: file.size,
          pageCount: 0,
          thumbnails: [],
          thumbsLoading: true,
          selectionMode: "all",
          selectedPages: [],
          error: null,
        });

        try {
          const meta = await getPdfMeta(file);
          set({ pageCount: meta.numPages });
          const { thumbnails } = await renderThumbnails(file, 40, 140);
          set({ thumbnails, thumbsLoading: false });
          get().toast("success", `"${file.name}" — ${bn(meta.numPages)} পাতা প্রস্তুত!`);
        } catch {
          set({ thumbsLoading: false });
          get().toast("info", "PDF প্রিভিউ তৈরিতে সমস্যা হয়েছে, তবে জেনারেট কাজ করবে।");
        }
      },

      clearPdf: () =>
        set({
          pdfFile: null,
          pdfName: "",
          pdfSize: 0,
          pageCount: 0,
          thumbnails: [],
          selectionMode: "all",
          selectedPages: [],
        }),

      setSelectionMode: (mode) =>
        set({
          selectionMode: mode,
          selectedPages: mode === "all" ? [] : get().selectedPages,
        }),

      togglePage: (page) =>
        set((s) => {
          const exists = s.selectedPages.includes(page);
          return {
            selectedPages: exists
              ? s.selectedPages.filter((p) => p !== page)
              : [...s.selectedPages, page].sort((a, b) => a - b),
          };
        }),

      applyRange: (rangeStr) => {
        const { pageCount } = get();
        const parsed = parsePageSelection(rangeStr, pageCount || 999);
        if (!parsed.length) {
          get().toast("error", `বৈধ পাতা বোঝা যায়নি (পাতা ১–${bn(pageCount)})`);
          return;
        }
        set({ selectedPages: parsed, selectionMode: "custom" });
        get().toast("success", `${bn(parsed.length)}টি পাতা নির্বাচিত হয়েছে`);
      },

      selectAllThumbs: () => {
        const count = get().pageCount || get().thumbnails.length;
        const all = Array.from({ length: count }, (_, i) => i + 1);
        set({ selectedPages: all, selectionMode: "custom" });
      },

      clearSelection: () => set({ selectedPages: [] }),

      onNodesChange: (changes) =>
        set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) as FlowNode[] })),

      onEdgesChange: (changes) =>
        set((s) => ({ edges: applyEdgeChanges(changes, s.edges) as FlowEdge[] })),

      connectNodes: (conn) => {
        const { edges } = get();
        if (!conn.source || !conn.target || conn.source === conn.target) return;
        const exists = edges.some(
          (e) => e.source === conn.source && e.target === conn.target
        );
        if (exists) return;
        set({
          edges: rfAddEdge({ ...conn, id: `e_${uid()}` }, edges) as FlowEdge[],
        });
      },

      updateNodeLabel: (id, label) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, label } } : n
          ),
          mapName:
            s.nodes.find((n) => n.id === id)?.data.kind === "root"
              ? label
              : s.mapName,
        })),

      updateNodeData: (id, partialData) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    ...partialData,
                  },
                }
              : n
          ),
        })),

      addNode: (kind) => {
        const { nodes, edges, direction } = get();
        const validKind = (NODE_KINDS as readonly string[]).includes(kind)
          ? kind
          : "event";
        const id = `node_${uid()}`;
        const parent = nodes.find((n) => n.selected);
        const base = parent
          ? parent.position
          : {
              x: 100 + (nodes.length % 5) * 35,
              y: 100 + (nodes.length % 5) * 35,
            };

        const pos =
          direction === "TB"
            ? { x: base.x, y: base.y + 160 }
            : { x: base.x + 300, y: base.y };

        const newNode: FlowNode = {
          id,
          type: "mindNode",
          position: pos,
          selected: true,
          data: {
            label: "নতুন নোড",
            kind: validKind,
            date: null,
            detail: null,
          },
        };

        const nextNodes = [
          ...nodes.map((n) => ({ ...n, selected: false })),
          newNode,
        ];
        const nextEdges = parent
          ? [...edges, { id: `e_${uid()}`, source: parent.id, target: id }]
          : edges;

        set({ nodes: nextNodes, edges: nextEdges });
        get().toast("info", "নতুন নোড যোগ হয়েছে — নাম পরিবর্তনে ডাবল ক্লিক করুন");
      },

      addSubNode: (parentId, label) => {
        const { nodes, edges, direction } = get();
        const parent = nodes.find((n) => n.id === parentId);
        if (!parent) return;

        const id = `sub_${uid()}`;
        const base = parent.position;
        const pos =
          direction === "TB"
            ? { x: base.x + 20, y: base.y + 110 }
            : { x: base.x + 230, y: base.y + 10 };

        const newNode: FlowNode = {
          id,
          type: "mindNode",
          position: pos,
          selected: true,
          data: {
            label: label || "নতুন বাড়তি তথ্য",
            kind: "subnode",
            date: null,
            detail: label || "এই নোডের সাথে সম্পর্কিত সুনির্দিষ্ট বা সূক্ষ্ম তথ্য",
            sourceContext: `${parent.data.label}-এর সাথে সম্পর্কিত বাড়তি তথ্য`,
          },
        };

        const newEdge: FlowEdge = {
          id: `esub_${uid()}`,
          source: parent.id,
          target: id,
          label: "বাড়তি তথ্য",
          style: { strokeDasharray: "4 3", stroke: "var(--k-subnode, #0284c7)" },
        };

        const nextNodes = [
          ...nodes.map((n) => ({ ...n, selected: false })),
          newNode,
        ];
        const nextEdges = [...edges, newEdge];
        const laidOut = applyLayout(nextNodes, nextEdges, direction);

        set((prev) => ({
          nodes: laidOut,
          edges: nextEdges,
          mapVersion: prev.mapVersion + 1,
        }));
        get().toast("info", "বাড়তি তথ্যের ছোট নোড বক্স যোগ হয়েছে — নাম পরিবর্তনে ডাবল ক্লিক করুন");
      },

      deleteSelected: () => {
        const { nodes, edges } = get();
        const delNodes = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
        const delEdges = new Set(edges.filter((e) => e.selected).map((e) => e.id));
        if (!delNodes.size && !delEdges.size) return;

        set({
          nodes: nodes.filter((n) => !delNodes.has(n.id)),
          edges: edges.filter(
            (e) =>
              !delEdges.has(e.id) &&
              !delNodes.has(e.source) &&
              !delNodes.has(e.target)
          ),
        });
      },

      setConnectMode: (v) => set({ connectMode: v }),

      relayout: () => {
        const { nodes, edges, direction } = get();
        set((s) => ({
          nodes: applyLayout(nodes, edges, direction),
          mapVersion: s.mapVersion + 1,
        }));
      },

      setDirection: (d) => {
        const dir = d === "TB" ? "TB" : "LR";
        const { nodes, edges } = get();
        set((s) => ({
          direction: dir,
          nodes: applyLayout(nodes, edges, dir),
          mapVersion: s.mapVersion + 1,
        }));
      },

      clearMap: () =>
        set({
          nodes: [],
          edges: [],
          mapName: "",
          mapMeta: null,
          mapId: null,
          error: null,
        }),

      loadSampleMap: (id) => {
        const sample = SAMPLE_MAPS.find((s) => s.id === id) || SAMPLE_MAPS[0];
        if (!sample) return;
        const sanitized = sanitizeMindMap(sample.data);
        const flow = toFlowGraph(sanitized);
        const laidOut = applyLayout(flow.nodes, flow.edges, get().direction);
        const newMapId = `m_${uid()}`;

        set((s) => ({
          nodes: laidOut,
          edges: flow.edges,
          mapName: sample.data.rootLabel,
          mapMeta: { pdfName: sample.name },
          mapId: newMapId,
          mapVersion: s.mapVersion + 1,
          sampleModalOpen: false,
          error: null,
        }));

        get().saveMapToHistory();
        get().toast(
          "success",
          `ডেমো লোড হয়েছে: ${sample.name} (${bn(sanitized.nodes.length)}টি নোড)`
        );
      },

      generate: async () => {
        const s = get();
        if (s.generating) return;

        if (s.inputMode === "pdf") {
          if (!s.pdfFile) {
            get().toast("error", "প্রথমে একটি PDF ফাইল আপলোড করুন অথবা ডেমো ম্যাপ লোড করুন।");
            return;
          }

          const customPages =
            s.selectionMode === "custom" ? s.selectedPages : null;
          if (customPages && customPages.length === 0) {
            get().toast("error", "কমপক্ষে একটি পাতা নির্বাচন করুন।");
            return;
          }
        } else {
          if (!s.pastedText || !s.pastedText.trim()) {
            get().toast("error", "অনুগ্রহ করে টেক্সট বক্সে কিছু তথ্য পেস্ট বা টাইপ করুন।");
            return;
          }
        }

        const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 1024;
        set({
          generating: true,
          error: null,
          progressMsg: PROGRESS_MESSAGES[0],
          progressSec: 0,
          ...(isSmallScreen ? { sidebarOpen: false } : {}),
        });

        let msgIdx = 0;
        if (msgTimer) clearInterval(msgTimer);
        if (secTimer) clearInterval(secTimer);

        msgTimer = setInterval(() => {
          msgIdx = (msgIdx + 1) % PROGRESS_MESSAGES.length;
          set({ progressMsg: PROGRESS_MESSAGES[msgIdx] });
        }, 2500);

        secTimer = setInterval(() => {
          set((prev) => ({ progressSec: prev.progressSec + 1 }));
        }, 1000);

        try {
          let requestBody: Record<string, unknown>;
          let metaDocName = "";
          let metaPages = 1;

          if (s.inputMode === "pdf") {
            const file = s.pdfFile!;
            const allPages = Array.from({ length: s.pageCount }, (_, i) => i + 1);
            const customPages =
              s.selectionMode === "custom" ? s.selectedPages : null;
            const usePages = customPages || allPages;

            set({ progressMsg: "নির্বাচিত পাতাগুলো প্রসেস করা হচ্ছে…" });
            const blobToUse =
              usePages.length >= s.pageCount
                ? file
                : await extractPages(file, usePages);

            set({ progressMsg: "ডকুমেন্ট Base64 এ এনকোড হচ্ছে…" });
            const base64 = await blobToBase64(blobToUse);

            requestBody = {
              pdfBase64: base64,
              model: s.model,
              apiKeyOverride: s.apiKey || undefined,
            };
            metaDocName = s.pdfName;
            metaPages = usePages.length;
          } else {
            set({ progressMsg: "টেক্সট বিশ্লেষণ ও মূল ঘটনা শনাক্তকরণ…" });
            requestBody = {
              textContent: s.pastedText.trim(),
              model: s.model,
              apiKeyOverride: s.apiKey || undefined,
            };
            const firstLine = s.pastedText.trim().split("\n")[0].trim().slice(0, 30);
            metaDocName = firstLine ? `নোট: ${firstLine}...` : "সরাসরি পেস্টকৃত টেক্সট";
            metaPages = 1;
          }

          set({ progressMsg: "Gemini AI কালরেখা ও সংযোগ বিশ্লেষণ করছে…" });
          const res = await fetch("/api/gemini/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || "মাইন্ড ম্যাপ তৈরি করা সম্ভব হয়নি।");
          }

          const sanitized = sanitizeMindMap(data.data);
          const flow = toFlowGraph(sanitized);
          const laidOut = applyLayout(flow.nodes, flow.edges, s.direction);
          const newMapId = `m_${uid()}`;
          const usedModel = data.model || s.model;

          set((prev) => ({
            nodes: laidOut,
            edges: flow.edges,
            mapName: sanitized.rootLabel,
            mapMeta: {
              pdfName: metaDocName,
              pages: metaPages,
              model: usedModel,
            },
            mapId: newMapId,
            mapVersion: prev.mapVersion + 1,
            generating: false,
            error: null,
          }));

          get().saveMapToHistory();

          if (data.fallbackNotice) {
            get().toast("info", data.fallbackNotice);
          }

          get().toast(
            "success",
            `মাইন্ড ম্যাপ সম্পন্ন! ${bn(sanitized.nodes.length)}টি নোড ও ${bn(
              sanitized.edges.length
            )}টি সংযোগ পাওয়া গেছে।`
          );
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "অজানা ত্রুটি";
          set({ generating: false, error: message });
          get().toast("error", message);
        } finally {
          if (msgTimer) clearInterval(msgTimer);
          if (secTimer) clearInterval(secTimer);
        }
      },

      saveMapToHistory: () => {
        const { nodes, edges, direction, mapName, mapMeta, mapId } = get();
        if (!nodes.length) return;
        const entry: HistoryItem = {
          id: mapId || `m_${uid()}`,
          name: mapName || "অনামা মাইন্ড ম্যাপ",
          createdAt: Date.now(),
          pdfName: mapMeta?.pdfName || "",
          direction,
          nodes,
          edges,
        };

        set((s) => ({
          history: [entry, ...s.history.filter((h) => h.id !== entry.id)].slice(
            0,
            24
          ),
          mapId: entry.id,
        }));
      },

      loadFromHistory: (id) => {
        const h = get().history.find((x) => x.id === id);
        if (!h) return;
        const laidOut = applyLayout(h.nodes, h.edges, h.direction || "LR");
        set((s) => ({
          nodes: laidOut,
          edges: h.edges,
          direction: h.direction || "LR",
          mapName: h.name,
          mapMeta: { pdfName: h.pdfName },
          mapId: h.id,
          error: null,
          mapVersion: s.mapVersion + 1,
        }));
        get().toast("info", `"${h.name}" লোড হয়েছে`);
      },

      deleteFromHistory: (id) =>
        set((s) => ({ history: s.history.filter((h) => h.id !== id) })),

      clearHistory: () => set({ history: [] }),

      importMapText: (text) => {
        try {
          const parsed = parseMapJSON(text);
          const needsLayout = parsed.nodes.some(
            (n) => !n.position || (n.position.x === 0 && n.position.y === 0)
          );
          const nodes = needsLayout
            ? applyLayout(parsed.nodes, parsed.edges, parsed.direction)
            : parsed.nodes;

          const newMapId = `m_${uid()}`;
          const rootLabel =
            parsed.nodes.find((n) => n.data.kind === "root")?.data.label ||
            parsed.name ||
            "ইমপোর্ট করা ম্যাপ";

          set((s) => ({
            nodes,
            edges: parsed.edges,
            direction: parsed.direction,
            mapName: rootLabel,
            mapMeta: null,
            mapId: newMapId,
            error: null,
            mapVersion: s.mapVersion + 1,
          }));

          get().saveMapToHistory();
          get().toast(
            "success",
            `JSON সফলভাবে ইমপোর্ট হয়েছে — ${bn(parsed.nodes.length)}টি নোড`
          );
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "ত্রুটি";
          get().toast("error", `ইমপোর্ট ব্যর্থ: ${message}`);
        }
      },
    }),
    {
      name: "sutra-store-v1",
      partialize: (s) => ({
        apiKey: s.apiKey,
        model: s.model,
        theme: s.theme,
        sidebarOpen: s.sidebarOpen,
        direction: s.direction,
        nodes: s.nodes,
        edges: s.edges,
        mapName: s.mapName,
        mapMeta: s.mapMeta,
        mapId: s.mapId,
        history: s.history,
        inputMode: s.inputMode,
        pastedText: s.pastedText,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && (!state.model || state.model === "gemini-2.5-flash")) {
          state.model = "gemini-3.8-flash";
        }
      },
    }
  )
);
