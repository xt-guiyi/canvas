import type { Edge } from '@vue-flow/core'

export type NodeKind = 'text' | 'image' | 'video'

export type NodeStatus = 'loading' | 'success' | 'error'

/** 本地上传媒体记录（支持 uploads 数组扩展多素材） */
export interface NodeMediaUpload {
  id: string
  url: string
  width: number
  height: number
  mimeType?: string
  fileName?: string
  uploadedAt?: string
}

/** 节点媒体展示区域尺寸（px） */
export interface NodeMediaSize {
  width: number
  height: number
}

export interface AiNodeData {
  /** 节点类型 */
  kind: NodeKind
  /** 节点卡片内显示的标题 */
  title: string
  /** 节点卡片内双击编辑的文本 */
  content: string
  /** 底部弹窗 AI 生成输入框的提示词 */
  prompt: string
  /**
   * 本地上传媒体列表（推荐）
   * 当前单文件上传写入一项，后续可扩展多项
   */
  uploads?: NodeMediaUpload[]
  /** 兼容旧数据：等同 uploads[0].url */
  mediaUrl?: string
  /** 由上传媒体比例计算的展示尺寸 */
  mediaSize?: NodeMediaSize
  /** 节点状态 */
  status?: NodeStatus
}

/** 画布 AI 节点（与 Vue Flow Node 结构兼容） */
export interface AiFlowNode {
  /** 节点 ID */
  id: string
  /** 节点类型 */
  type: 'ai'
  /** 节点位置 */
  position: { x: number; y: number }
  data: AiNodeData
  /** 是否选中 */
  selected?: boolean
  /** 节点样式类 */
  class?: string | string[]
}

export type CanvasEdge = Edge

export interface PanelConfig {
  modelLabel: string
  refLabel: string
  specLabel: string
  credits: number
}

/** 节点预设 */
export interface NodePreset {
  key: NodeKind
  label: string
  data: Omit<AiNodeData, 'kind'>
}

export interface CanvasProject {
  id: string
  name: string
  nodes: AiFlowNode[]
  edges: CanvasEdge[]
  updatedAt: string
}

export interface UpstreamMediaPreview {
  kind: 'image' | 'video'
  url: string
}

export interface GeneratePayload {
  nodeId: string
  kind: NodeKind
  prompt: string
}

export interface GenerateResult {
  nodeId: string
  content: string
  status: NodeStatus
}
