import type { NodeKind, NodePreset, PanelConfig } from '@/types/canvas'

export const NODE_PRESETS: NodePreset[] = [
  {
    key: 'text',
    label: '文本',
    data: {
      title: '文本节点',
      content: '',
      prompt: '',
    },
  },
  {
    key: 'image',
    label: '图片生成',
    data: {
      title: '图片生成节点',
      content: '',
      prompt: '',
    },
  },
  {
    key: 'video',
    label: '视频生成',
    data: {
      title: '视频生成节点',
      content: '',
      prompt: '',
    },
  },
]

export const PANEL_CONFIG: Record<NodeKind, PanelConfig> = {
  text: {
    modelLabel: 'Gemini 3 Flasd',
    refLabel: '上下文',
    specLabel: '',
    credits: 10,
  },
  image: {
    modelLabel: 'Gemini 3 Flasd',
    refLabel: '风格参考',
    specLabel: '',
    credits: 5,
  },
  video: {
    modelLabel: 'Seedance 2.0',
    refLabel: '首尾帧',
    specLabel: 'Omni Reference · 16:9 · 7220p · 5s',
    credits: 112,
  },
}

export const TYPE_LABELS: Record<NodeKind, string> = {
  text: 'Text',
  image: 'Image',
  video: 'Video',
}
