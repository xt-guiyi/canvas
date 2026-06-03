import type { AiFlowNode, NodeKind } from '@/types/canvas'
import { DEFAULT_NODE_BODY_SIZE } from '@/views/canvas/constants/nodeStyles'

const NODE_GAP = 64

export function getNodeWidth(kind: NodeKind): number {
  return DEFAULT_NODE_BODY_SIZE[kind].width
}

export function getNodeWidthForNode(node: Pick<AiFlowNode, 'data'>): number {
  return node.data.mediaSize?.width ?? getNodeWidth(node.data.kind)
}

/** 根据句柄方向，计算新节点的画布坐标 */
export function getConnectedNodePosition(
  sourcePosition: { x: number; y: number },
  sourceNode: Pick<AiFlowNode, 'data'>,
  newKind: NodeKind,
  handleType: 'source' | 'target',
): { x: number; y: number } {
  const sourceWidth = getNodeWidthForNode(sourceNode)
  const newWidth = DEFAULT_NODE_BODY_SIZE[newKind].width

  if (handleType === 'source') {
    return {
      x: sourcePosition.x + sourceWidth + NODE_GAP,
      y: sourcePosition.y,
    }
  }

  return {
    x: sourcePosition.x - newWidth - NODE_GAP,
    y: sourcePosition.y,
  }
}
