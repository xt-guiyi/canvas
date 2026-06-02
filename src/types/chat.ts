/**
 * Chat type definitions shared across store and components.
 */

export interface ToolEvent {
  type: 'tool-call' | 'tool-result'
  toolCallId: string
  toolName: string
  args?: Record<string, unknown>
  result?: string
  expanded: boolean
}

export interface ChatAttachment {
  type: 'file'
  mediaType: string
  filename?: string
  url: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  attachments?: ChatAttachment[]
  reasoningContent?: string
  thinkingMode?: boolean
  toolEvents?: ToolEvent[]
  isStreaming?: boolean
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export type ToolState =
  | 'input-streaming'
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-available'
  | 'output-error'
  | 'output-denied'

export const TOOL_LABELS: Record<string, string> = {
  get_current_time: '查询当前时间',
  get_weather: '查询天气',
  word_count: '统计字数',
}

export function toolLabel(name: string, type: 'tool-call' | 'tool-result'): string {
  const base = TOOL_LABELS[name] ?? name
  return type === 'tool-call' ? `正在${base}` : `已${base}`
}
