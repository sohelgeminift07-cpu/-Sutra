import { toPng, toSvg } from "html-to-image";
import { FlowNode, FlowEdge } from "./layoutUtils";

function viewportEl(): HTMLElement | null {
  return document.querySelector(".react-flow__viewport");
}

function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  downloadDataUrl(filename, url);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const skipUi = (node: HTMLElement): boolean => {
  const cls = node?.className || "";
  if (typeof cls !== "string") return true;
  return !/react-flow__(controls|minimap|panel|attribution)/.test(cls);
};

export async function exportPNG(filename: string, bgColor: string) {
  const el = viewportEl();
  if (!el) throw new Error("ক্যানভাস উপাদান পাওয়া যায়নি।");
  const dataUrl = await toPng(el, {
    backgroundColor: bgColor,
    pixelRatio: 2,
    cacheBust: true,
    filter: skipUi,
  });
  downloadDataUrl(filename, dataUrl);
}

export async function exportSVG(filename: string, bgColor: string) {
  const el = viewportEl();
  if (!el) throw new Error("ক্যানভাস উপাদান পাওয়া যায়নি।");
  const dataUrl = await toSvg(el, {
    backgroundColor: bgColor,
    cacheBust: true,
    filter: skipUi,
  });
  downloadDataUrl(filename, dataUrl);
}

export function exportJSON(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  downloadBlob(filename, blob);
}

export interface ParsedMapJSON {
  nodes: FlowNode[];
  edges: FlowEdge[];
  direction: "LR" | "TB";
  name?: string;
}

export function parseMapJSON(text: string): ParsedMapJSON {
  const data = JSON.parse(text);
  const nodes = Array.isArray(data?.nodes)
    ? (data.nodes as Array<{
        id?: unknown;
        data?: {
          label?: unknown;
          kind?: unknown;
          date?: unknown;
          detail?: unknown;
        };
        position?: { x: number; y: number };
      }>)
    : null;
  const edges = Array.isArray(data?.edges)
    ? (data.edges as Array<{
        id?: unknown;
        source?: string;
        target?: string;
        label?: string;
      }>)
    : [];
  if (!nodes || !nodes.length) {
    throw new Error("ফাইলে কোনো নোড তথ্য পাওয়া যায়নি।");
  }

  const cleanNodes: FlowNode[] = nodes
    .filter((n): n is NonNullable<typeof n> => Boolean(n && n.id && n.data))
    .map((n) => ({
      id: String(n.id),
      type: "mindNode",
      position: n.position || { x: 0, y: 0 },
      data: {
        label: String(n.data?.label || "নোড"),
        kind: String(n.data?.kind || "event"),
        date: n.data?.date ? String(n.data.date) : null,
        detail: n.data?.detail ? String(n.data.detail) : null,
      },
    }));

  const ids = new Set(cleanNodes.map((n) => n.id));
  const cleanEdges: FlowEdge[] = edges
    .filter(
      (e): e is { id?: unknown; source: string; target: string; label?: string } =>
        Boolean(
          e &&
            typeof e.source === "string" &&
            typeof e.target === "string" &&
            ids.has(e.source) &&
            ids.has(e.target)
        )
    )
    .map((e, i) => ({
      id: String(e.id || `e${i}`),
      source: e.source,
      target: e.target,
      label: e.label || undefined,
    }));

  return {
    nodes: cleanNodes,
    edges: cleanEdges,
    direction: data.direction === "TB" ? "TB" : "LR",
    name: data.name || undefined,
  };
}
