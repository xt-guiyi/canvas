import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ChatAttachment, ChatMessage, ChatSession } from '@/types/chat'

const API_URL = 'http://127.0.0.1:8000/api/v1/chat/agent'
const CHAT_SESSIONS_STORAGE_KEY = 'agent_chat_sessions_v1'
const CURRENT_SESSION_STORAGE_KEY = 'agent_current_session_id_v1'

function createSession(title = '新会话'): ChatSession {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
}

function sessionTitleFromMessage(text: string, attachments: ChatAttachment[]) {
  const trimmed = text.trim()
  if (trimmed) return trimmed.slice(0, 24)
  if (attachments.length) return attachments[0]?.filename || '附件会话'
  return '新会话'
}

function loadSessions() {
  try {
    const raw = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as ChatSession[] : []
  } catch {
    return []
  }
}

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>(loadSessions())
  const currentSessionId = ref(localStorage.getItem(CURRENT_SESSION_STORAGE_KEY) || '')
  const isLoading = ref(false)
  const thinkingMode = ref(false)

  if (sessions.value.length === 0) {
    const session = createSession()
    sessions.value = [session]
    currentSessionId.value = session.id
  } else if (!sessions.value.some(session => session.id === currentSessionId.value)) {
    currentSessionId.value = sessions.value[0]!.id
  }

  const currentSession = computed(() =>
    sessions.value.find(session => session.id === currentSessionId.value) ?? sessions.value[0],
  )
  const messages = computed(() => currentSession.value?.messages ?? [])

  watch(
    sessions,
    value => localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(value)),
    { deep: true },
  )

  watch(
    currentSessionId,
    value => localStorage.setItem(CURRENT_SESSION_STORAGE_KEY, value),
    { immediate: true },
  )

  function touchCurrentSession() {
    if (!currentSession.value) return
    currentSession.value.updatedAt = Date.now()
  }

  function setCurrentTitleFromFirstUserMessage(text: string, attachments: ChatAttachment[]) {
    if (!currentSession.value || currentSession.value.messages.length > 0) return
    currentSession.value.title = sessionTitleFromMessage(text, attachments)
  }

  function createNewSession() {
    const session = createSession()
    sessions.value.unshift(session)
    currentSessionId.value = session.id
    isLoading.value = false
  }

  function selectSession(id: string) {
    if (isLoading.value || !sessions.value.some(session => session.id === id)) return
    currentSessionId.value = id
  }

  function deleteSession(id: string) {
    if (isLoading.value) return
    sessions.value = sessions.value.filter(session => session.id !== id)
    if (sessions.value.length === 0) {
      createNewSession()
      return
    }
    if (currentSessionId.value === id) {
      currentSessionId.value = sessions.value[0]!.id
    }
  }

  async function sendMessage(text: string, attachments: ChatAttachment[] = []) {
    if ((!text.trim() && attachments.length === 0) || isLoading.value) return
    if (!currentSession.value) createNewSession()

    const session = currentSession.value!
    setCurrentTitleFromFirstUserMessage(text, attachments)
    session.messages.push({ role: 'user', content: text, attachments })
    touchCurrentSession()

    const aiMsg: ChatMessage = {
      role: 'assistant',
      content: '',
      reasoningContent: '',
      thinkingMode: thinkingMode.value,
      toolEvents: [],
      isStreaming: true,
    }
    session.messages.push(aiMsg)
    const aiIdx = session.messages.length - 1
    isLoading.value = true

    const history = session.messages
      .slice(0, aiIdx)
      .filter(
        (m) =>
          m.role === 'user' || (m.role === 'assistant' && m.content),
      )
      .map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.attachments?.length ? { attachments: m.attachments } : {}),
      }))

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          model: 'codex:gpt-5.5',
          temperature: 0.7,
          thinking_mode: thinkingMode.value,
        }),
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      const callIdMap: Record<string, number> = {}

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break outer

          let evt: Record<string, unknown>
          try {
            evt = JSON.parse(raw)
          } catch {
            continue
          }

          const cur = session.messages[aiIdx]!

          if (evt.type === 'text-delta') {
            cur.content += (evt.text as string) ?? ''
          } else if (evt.type === 'reasoning-delta') {
            cur.reasoningContent = `${cur.reasoningContent ?? ''}${(evt.text as string) ?? ''}`
          } else if (evt.type === 'meta') {
            if (evt.thinkingMode) {
              cur.reasoningContent = `${cur.reasoningContent ?? ''}已连接思考模式：${evt.serviceVersion ?? 'unknown'}\n\n`
            }
          } else if (evt.type === 'error') {
            cur.content = `请求失败：${(evt.message as string) ?? '模型接口异常'}`
          } else if (evt.type === 'tool-call') {
            const i = cur.toolEvents!.length
            callIdMap[evt.toolCallId as string] = i
            cur.toolEvents!.push({
              type: 'tool-call',
              toolCallId: evt.toolCallId as string,
              toolName: evt.toolName as string,
              args: evt.args as Record<string, unknown>,
              expanded: false,
            })
          } else if (evt.type === 'tool-result') {
            const tid = evt.toolCallId as string
            const ei = callIdMap[tid]
            if (ei !== undefined) {
              cur.toolEvents![ei] = {
                type: 'tool-result',
                toolCallId: tid,
                toolName: evt.toolName as string,
                args: cur.toolEvents![ei]!.args,
                result: evt.result as string,
                expanded: false,
              }
            } else {
              const ni = cur.toolEvents!.length
              callIdMap[tid] = ni
              cur.toolEvents!.push({
                type: 'tool-result',
                toolCallId: tid,
                toolName: evt.toolName as string,
                result: evt.result as string,
                expanded: false,
              })
            }
          }
        }
      }
    } catch (err) {
      session.messages[aiIdx]!.content = `请求失败：${err instanceof Error ? err.message : String(err)}`
    } finally {
      session.messages[aiIdx]!.isStreaming = false
      isLoading.value = false
      touchCurrentSession()
    }
  }

  function clearMessages() {
    if (!currentSession.value) return
    currentSession.value.messages = []
    currentSession.value.title = '新会话'
    touchCurrentSession()
    isLoading.value = false
  }

  function setThinkingMode(enabled: boolean) {
    thinkingMode.value = enabled
  }

  function toggleThinkingMode() {
    thinkingMode.value = !thinkingMode.value
  }

  return {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    isLoading,
    thinkingMode,
    sendMessage,
    clearMessages,
    createNewSession,
    selectSession,
    deleteSession,
    setThinkingMode,
    toggleThinkingMode,
  }
})
