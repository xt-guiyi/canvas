<script setup lang="ts">
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import type { ChatMessage } from '@/types/chat'
import ChatUserMessage from './ChatUserMessage.vue'
import ChatAssistantMessage from './ChatAssistantMessage.vue'

interface Props {
  messages: ChatMessage[]
}

defineProps<Props>()
</script>

<template>
  <Conversation class="min-h-0 flex-1 px-2">
    <ConversationContent class="mx-auto w-full max-w-4xl gap-4 px-0 py-4">
      <template v-for="(msg, idx) in messages" :key="idx">
        <ChatUserMessage
          v-if="msg.role === 'user'"
          :content="msg.content"
          :attachments="msg.attachments"
        />
        <ChatAssistantMessage
          v-else
          :content="msg.content"
          :reasoning-content="msg.reasoningContent"
          :thinking-mode="msg.thinkingMode"
          :tool-events="msg.toolEvents"
          :is-streaming="msg.isStreaming"
        />
      </template>
    </ConversationContent>
    <ConversationScrollButton
      class="bottom-3 border-white/10 bg-background/90 shadow-lg backdrop-blur hover:bg-muted"
    />
  </Conversation>
</template>
