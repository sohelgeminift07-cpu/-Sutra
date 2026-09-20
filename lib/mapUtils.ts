import { FlowNode, FlowEdge } from "./layoutUtils";

export const NODE_KINDS = [
  "root",
  "date",
  "event",
  "person",
  "place",
  "decision",
  "document",
  "outcome",
  "subnode",
] as const;

export type NodeKind = (typeof NODE_KINDS)[number];

const KIND_SET = new Set<string>(NODE_KINDS);

function extractYear(label?: string | null): number {
  if (!label) return Infinity;
  // Look for 3 or 4 digits (e.g. 1971, 1952, or Bengali digits)
  const converted = label.replace(/[০-৯]/g, (d) =>
    String("০১২৩৪৫৬৭৮৯".indexOf(d))
  );
  const m = converted.match(/\d{3,4}/);
  return m ? Number(m[0]) : Infinity;
}

export interface RawNode {
  id?: string;
  label?: string;
  type?: string;
  kind?: string;
  date?: string | null;
  detail?: string | null;
  sourceContext?: string | null;
  extraDetails?: string[] | null;
  [key: string]: unknown;
}

export interface RawEdge {
  id?: string;
  source?: string;
  target?: string;
  label?: string | null;
}

export interface RawMap {
  rootLabel?: string;
  nodes?: RawNode[];
  edges?: RawEdge[];
}

export interface SanitizedNode {
  id: string;
  label: string;
  kind: NodeKind;
  date: string | null;
  detail: string | null;
  sourceContext?: string | null;
  extraDetails?: string[] | null;
}

export interface SanitizedEdge {
  id: string;
  source: string;
  target: string;
  label: string | null;
}

export interface SanitizedMap {
  rootLabel: string;
  nodes: SanitizedNode[];
  edges: SanitizedEdge[];
}

export function sanitizeMindMap(raw: RawMap): SanitizedMap {
  const rawNodes = Array.isArray(raw?.nodes) ? raw.nodes : [];
  const rawEdges = Array.isArray(raw?.edges) ? raw.edges : [];

  const seen = new Set<string>();
  const nodes: SanitizedNode[] = [];
  const generatedSubEdges: Array<{ source: string; target: string; label: string }> = [];

  for (const n of rawNodes) {
    if (!n || !n.label) continue;
    let id = String(n.id || `n${nodes.length + 1}`).trim();
    while (seen.has(id)) {
      id = `${id}_x`;
    }
    seen.add(id);

    const kindCandidate = n.type || n.kind || "event";
    const kind: NodeKind = KIND_SET.has(kindCandidate)
      ? (kindCandidate as NodeKind)
      : "event";

    const rawDetail = n.detail ? String(n.detail).slice(0, 300).trim() : null;
    const rawContext = n.sourceContext ? String(n.sourceContext).slice(0, 3000).trim() : null;

    // Extract extra details array if present
    const rawExtras = Array.isArray(n.extraDetails)
      ? (n.extraDetails as unknown[]).filter((x) => typeof x === "string" && x.trim().length > 0).map(String)
      : [];

    nodes.push({
      id,
      label: String(n.label).slice(0, 160).trim(),
      kind,
      date: n.date ? String(n.date).slice(0, 60).trim() : null,
      detail: rawDetail,
      // Always ensure sourceContext is available so user can read full info immediately upon expansion
      sourceContext: rawContext || rawDetail,
      extraDetails: rawExtras.length > 0 ? rawExtras : null,
    });

    // Automatically spawn connected small subnode boxes from extraDetails
    if (kind !== "subnode" && rawExtras.length > 0) {
      rawExtras.slice(0, 3).forEach((extraText, subIdx) => {
        let subId = `${id}_sub_${subIdx + 1}`;
        while (seen.has(subId)) {
          subId = `${subId}_x`;
        }
        seen.add(subId);

        const cleanText = extraText.slice(0, 160).trim();
        nodes.push({
          id: subId,
          label: cleanText,
          kind: "subnode",
          date: null,
          detail: cleanText,
          sourceContext: `${n.label}-এর সাথে সম্পর্কিত বাড়তি তথ্য:\n${cleanText}`,
          extraDetails: null,
        });

        generatedSubEdges.push({
          source: id,
          target: subId,
          label: "বাড়তি তথ্য",
        });
      });
    }
  }

  // Ensure root node exists
  let rootNode = nodes.find((n) => n.kind === "root");
  if (!rootNode) {
    const rootId = seen.has("root") ? "root_main" : "root";
    const defaultRootLabel = String(raw?.rootLabel || "প্রধান বিষয়").slice(0, 80).trim();
    rootNode = {
      id: rootId,
      label: defaultRootLabel,
      kind: "root",
      date: null,
      detail: `মূল বিষয়: ${defaultRootLabel}`,
      sourceContext: `মূল বিষয়: ${defaultRootLabel}`,
    };
    nodes.unshift(rootNode);
    seen.add(rootNode.id);
  }

  const ids = new Set(nodes.map((n) => n.id));
  const edges: SanitizedEdge[] = [];
  const edgeKeys = new Set<string>();

  // Add user/raw edges
  for (const e of rawEdges) {
    const s = String(e?.source ?? "").trim();
    const t = String(e?.target ?? "").trim();
    if (!ids.has(s) || !ids.has(t) || s === t) continue;
    const key = `${s}->${t}`;
    if (edgeKeys.has(key)) continue;
    edgeKeys.add(key);
    edges.push({
      id: `e_${edges.length}_${s}_${t}`.slice(0, 60),
      source: s,
      target: t,
      label: e.label ? String(e.label).slice(0, 40).trim() : null,
    });
  }

  // Add generated subnode edges
  for (const ge of generatedSubEdges) {
    if (!ids.has(ge.source) || !ids.has(ge.target) || ge.source === ge.target) continue;
    const key = `${ge.source}->${ge.target}`;
    if (edgeKeys.has(key)) continue;
    edgeKeys.add(key);
    edges.push({
      id: `esub_${edges.length}_${ge.source}_${ge.target}`.slice(0, 60),
      source: ge.source,
      target: ge.target,
      label: ge.label,
    });
  }

  // Connect any orphan node (that has no incoming edge) to root
  const hasIncoming = new Set(edges.map((e) => e.target));
  for (const n of nodes) {
    if (n.id === rootNode.id || hasIncoming.has(n.id)) continue;
    const key = `${rootNode.id}->${n.id}`;
    if (!edgeKeys.has(key)) {
      edgeKeys.add(key);
      edges.push({
        id: `ea_${n.id}`.slice(0, 60),
        source: rootNode.id,
        target: n.id,
        label: null,
      });
    }
  }

  // Order date nodes chronologically (earliest to latest)
  const dateNodes = nodes.filter((n) => n.kind === "date");
  if (dateNodes.length > 1) {
    const orderMap = new Map(
      dateNodes.map((n, i) => [
        n.id,
        { year: extractYear(n.date || n.label), index: i },
      ])
    );
    nodes.sort((a, b) => {
      const oa = orderMap.get(a.id);
      const ob = orderMap.get(b.id);
      if (oa && ob) return oa.year - ob.year || oa.index - ob.index;
      if (a.kind === "root") return -1;
      if (b.kind === "root") return 1;
      return 0;
    });
  } else if (nodes[0]?.kind !== "root") {
    const ri = nodes.findIndex((n) => n.kind === "root");
    if (ri > 0) {
      const [r] = nodes.splice(ri, 1);
      nodes.unshift(r);
    }
  }

  return {
    rootLabel: String(raw?.rootLabel || rootNode.label),
    nodes,
    edges,
  };
}

export function toFlowGraph(map: SanitizedMap): {
  nodes: FlowNode[];
  edges: FlowEdge[];
} {
  const rootId = map.nodes.find((n) => n.kind === "root")?.id;
  const nodeKindMap = new Map(map.nodes.map((n) => [n.id, n.kind]));

  const nodes: FlowNode[] = map.nodes.map((n) => ({
    id: n.id,
    type: "mindNode",
    position: { x: 0, y: 0 },
    data: {
      label: n.label,
      kind: n.kind,
      date: n.date,
      detail: n.detail,
      sourceContext: n.sourceContext || null,
    },
  }));

  const edges: FlowEdge[] = map.edges.map((e, i) => {
    const isTargetSubnode = nodeKindMap.get(e.target) === "subnode";
    return {
      id: e.id || `e${i}`,
      source: e.source,
      target: e.target,
      label: e.label || undefined,
      animated: e.source === rootId,
      style: isTargetSubnode
        ? { strokeDasharray: "4 3", stroke: "var(--k-subnode, #0284c7)" }
        : undefined,
      type: "default",
    };
  });

  return { nodes, edges };
}
