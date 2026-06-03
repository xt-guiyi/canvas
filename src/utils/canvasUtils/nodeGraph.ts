import type { AiNodeData, UpstreamMediaPreview } from '@/types/canvas'
import { getPrimaryMediaUrl } from '@/utils/canvasUtils/nodeMedia'

interface GraphNode {
  id: string
  data?: AiNodeData
}

interface GraphEdge {
  source: string
  target: string
}

/** 获取直接上游连接节点中的图片/视频预览（取第一个有效项） */
export function getUpstreamMediaPreview(
  nodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
): UpstreamMediaPreview | null {
  for (const edge of edges) {
    if (edge.target !== nodeId) continue
    const source = nodes.find(n => n.id === edge.source)
    const kind = source?.data?.kind
    const url = getPrimaryMediaUrl(source?.data)
    if ((kind === 'image' || kind === 'video') && url) {
      return { kind, url }
    }
  }
  return null
}
