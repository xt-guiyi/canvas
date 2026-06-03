import type { AiNodeData } from '@/types/canvas'

/** 节点卡片内双击编辑的文本 */
export function getNodeContent(data: AiNodeData | undefined): string {
  if (!data) return ''
  return data.content ?? ''
}

/** 底部弹窗 AI 生成输入框的提示词 */
export function getNodePrompt(data: AiNodeData | undefined): string {
  if (!data) return ''
  return data.prompt ?? ''
}
