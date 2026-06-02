<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useChatStore } from '@/stores/chat'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input/types'
import type { ChatAttachment } from '@/types/chat'

import ChatHeader from './components/ChatHeader.vue'
import ChatSessionHistory from './components/ChatSessionHistory.vue'
import ChatEmptyState from './components/ChatEmptyState.vue'
import ChatMessageList from './components/ChatMessageList.vue'
import ChatInputArea from './components/ChatInputArea.vue'

const chatStore = useChatStore()
const emit = defineEmits<{  
  (e: 'close'): void
}>()
const showHistory = ref(false)

const hasMessages = computed(() => chatStore.messages.length > 0)
const inputStatus = computed(() =>
  chatStore.isLoading ? 'streaming' : 'ready',
)

const MOCK_ATTACHMENT_URL = 'https://magic-ai-mk-static.oss-cn-beijing.aliyuncs.com/%E6%A0%BC%E5%8A%9B.mp4'

async function uploadAttachmentPlaceholder(file: PromptInputMessage['files'][number]): Promise<ChatAttachment> {
  return {
    type: 'file',
    mediaType: 'video/mp4',
    filename: file.filename,
    url: MOCK_ATTACHMENT_URL,
  }
}

async function handleSubmit(payload: PromptInputMessage) {
  const text = payload.text?.trim()
  const attachments = await Promise.all(payload.files.map(uploadAttachmentPlaceholder))

  if (!text && attachments.length === 0) return
  chatStore.sendMessage(text, attachments)
}

function handleSuggestion(text: string) {
  chatStore.sendMessage(text)
}

onMounted(() => {
  const ta = document.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder]',
    )
  ta?.focus()
})
</script>

<template>
  <div class="relative flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
    <ChatHeader
      @open-history="showHistory = true"
      @new-chat="chatStore.createNewSession"
      @close="emit('close')"
    />
    <ChatSessionHistory
      v-if="showHistory"
      :sessions="chatStore.sessions"
      :current-session-id="chatStore.currentSessionId"
      :disabled="chatStore.isLoading"
      @select="chatStore.selectSession"
      @delete="chatStore.deleteSession"
      @close="showHistory = false"
    />

    <main class="flex min-h-0 flex-1 flex-col">
      <ChatEmptyState
        v-if="!hasMessages"
        @select="handleSuggestion"
      />

      <ChatMessageList
        v-else
        :messages="chatStore.messages"
      />

      <ChatInputArea
        :status="inputStatus"
        :thinking-mode="chatStore.thinkingMode"
        @toggle-thinking-mode="chatStore.toggleThinkingMode"
        @submit="handleSubmit"
      />
    </main>
  </div>
</template>
