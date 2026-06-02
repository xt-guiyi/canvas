// Chat API service for AI conversations

const API_BASE_URL = 'http://127.0.0.1:8000'
const DEFAULT_MODEL = 'codex:gpt-5.5'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  stream?: boolean
  thinking_mode?: boolean
}

/**
 * Available models
 */
export const AVAILABLE_MODELS = {
  gemini: [
    { value: DEFAULT_MODEL, label: 'Gemini 2.5 Flash Lite' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
    { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
}

/**
 * Stream chat response using Server-Sent Events
 */
export async function* streamChat(
  messages: ChatMessage[],
  options: { model?: string; temperature?: number } = {},
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: options.model || DEFAULT_MODEL,
      temperature: options.temperature || 0.7,
      stream: true,
    } as ChatRequest),
  })

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status} ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Process SSE data
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const match = line.match(/^data: (.+)$/m)
      if (match?.[1]) {
        const data = match[1].trim()
        if (data === '[DONE]') {
          return
        }
        yield data
      }
    }
  }
}

/**
 * Get complete chat response (non-streaming)
 */
export async function completeChat(
  messages: ChatMessage[],
  options: { model?: string; temperature?: number } = {},
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: options.model || DEFAULT_MODEL,
      temperature: options.temperature || 0.7,
      stream: false,
    } as ChatRequest),
  })

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.message.content
}
