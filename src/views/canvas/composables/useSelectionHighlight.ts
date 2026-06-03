import type { Ref } from 'vue'
import type { AiFlowNode, CanvasEdge } from '@/types/canvas'

const NODE_HIGHLIGHT_CLASS = 'node-highlight-primary'
const EDGE_HIGHLIGHT_CLASS = 'edge-highlight'

export function getConnectedEdgeIds(
  selectedNodeId: string,
  edges: CanvasEdge[],
): Set<string> {
  const edgeIds = new Set<string>()
  for (const edge of edges) {
    if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
      edgeIds.add(edge.id)
    }
  }
  return edgeIds
}

function stripNodeHighlight(value: AiFlowNode['class']): string | undefined {
  const list = !value
    ? []
    : Array.isArray(value)
      ? [...value]
      : value.split(/\s+/).filter(Boolean)
  const filtered = list.filter(c => c !== NODE_HIGHLIGHT_CLASS)
  return filtered.length > 0 ? filtered.join(' ') : undefined
}

function stripEdgeHighlight(value: CanvasEdge['class']): string | undefined {
  const raw = typeof value === 'string' ? value : ''
  const filtered = raw.split(/\s+/).filter(c => c && c !== EDGE_HIGHLIGHT_CLASS)
  return filtered.length > 0 ? filtered.join(' ') : undefined
}

function mergeNodeClass(existing: AiFlowNode['class'], add: string): string {
  const base = stripNodeHighlight(existing)
  return base ? `${base} ${add}` : add
}

function mergeEdgeClass(existing: CanvasEdge['class'], add: string): string {
  const base = stripEdgeHighlight(existing)
  return base ? `${base} ${add}` : add
}

/** 原地更新 class，避免替换 nodes/edges 数组与 Vue Flow v-model 冲突 */
export function useSelectionHighlight(
  nodes: Ref<AiFlowNode[]>,
  edges: Ref<CanvasEdge[]>,
) {
  function syncHighlight(id: string | null) {
    for (const node of nodes.value) {
      const nextClass =
        id && node.id === id
          ? mergeNodeClass(node.class, NODE_HIGHLIGHT_CLASS)
          : stripNodeHighlight(node.class)
      if (node.class !== nextClass) {
        node.class = nextClass
      }
    }

    const edgeIds = id ? getConnectedEdgeIds(id, edges.value) : new Set<string>()

    for (const edge of edges.value) {
      const nextClass = edgeIds.has(edge.id)
        ? mergeEdgeClass(edge.class, EDGE_HIGHLIGHT_CLASS)
        : stripEdgeHighlight(edge.class)
      if (edge.class !== nextClass) {
        edge.class = nextClass
      }
    }
  }

  return { syncHighlight }
}
