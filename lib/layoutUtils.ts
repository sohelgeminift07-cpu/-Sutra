import dagre from "@dagrejs/dagre";

export interface NodeSize {
  width: number;
  height: number;
}

export const NODE_SIZE: Record<string, NodeSize> = {
  root: { width: 240, height: 86 },
  date: { width: 200, height: 70 },
  event: { width: 220, height: 76 },
  person: { width: 220, height: 76 },
  place: { width: 220, height: 76 },
  decision: { width: 220, height: 76 },
  document: { width: 220, height: 76 },
  outcome: { width: 220, height: 76 },
  subnode: { width: 175, height: 50 },
  default: { width: 220, height: 76 },
};

export function sizeFor(kind?: string): NodeSize {
  if (!kind) return NODE_SIZE.default;
  return NODE_SIZE[kind] || NODE_SIZE.default;
}

export interface FlowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  selected?: boolean;
  data: {
    label: string;
    kind: string;
    date?: string | null;
    detail?: string | null;
    sourceContext?: string | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  selected?: boolean;
  animated?: boolean;
  type?: string;
  [key: string]: unknown;
}

export function applyLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: "LR" | "TB" = "LR"
): FlowNode[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 42,
    ranksep: 104,
    edgesep: 20,
    marginx: 36,
    marginy: 36,
  });

  for (const n of nodes) {
    const s = sizeFor(n?.data?.kind);
    g.setNode(n.id, { width: s.width, height: s.height });
  }

  for (const e of edges) {
    if (g.hasNode(e.source) && g.hasNode(e.target) && e.source !== e.target) {
      g.setEdge(e.source, e.target);
    }
  }

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id) || { x: 0, y: 0 };
    const s = sizeFor(n?.data?.kind);
    return {
      ...n,
      position: {
        x: Math.round(pos.x - s.width / 2),
        y: Math.round(pos.y - s.height / 2),
      },
    };
  });
}
