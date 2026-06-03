import type { NodeKind, NodeMediaSize } from '@/types/canvas'

export interface NodeStyleConfig {
  label: string
  bodyClass: string
  placeholder: string
}

/** 各类型节点默认内容区尺寸（px） */
export const DEFAULT_NODE_BODY_SIZE: Record<NodeKind, NodeMediaSize> = {
  text: { width: 158, height: 158 },
  image: { width: 158, height: 158 },
  video: { width: 280, height: 158 },
}

export const NODE_STYLE: Record<NodeKind, NodeStyleConfig> = {
  text: {
    label: 'Text',
    bodyClass: 'h-[158px] w-[158px]',
    placeholder: '双击开始编辑...',
  },
  image: {
    label: 'Image',
    bodyClass: 'h-[158px] w-[158px]',
    placeholder: '',
  },
  video: {
    label: 'Video',
    bodyClass: 'h-[158px] w-[280px]',
    placeholder: '',
  },
}
