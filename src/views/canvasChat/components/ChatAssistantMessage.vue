<script setup lang="ts">
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import type { ToolEvent } from '@/types/chat'
import ChatToolCall from './ChatToolCall.vue'

interface Props {
  content: string
  reasoningContent?: string
  thinkingMode?: boolean
  toolEvents?: ToolEvent[]
  isStreaming?: boolean
}

defineProps<Props>()
</script>

<template>
  <Message from="assistant" class="items-start">
    <MessageContent class="w-full gap-3 text-sm leading-7 text-foreground/90">
      <Reasoning
        v-if="thinkingMode || reasoningContent"
        :is-streaming="isStreaming"
        :default-open="false"
        class="mb-0 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3"
      >
        <ReasoningTrigger class="text-xs" />
        <ReasoningContent
          :content="reasoningContent || '等待模型返回思考过程...'"
          class="mt-3 text-xs leading-6"
        />
      </Reasoning>

      <!-- Tool calls -->
      <template v-if="toolEvents && toolEvents.length">
        <ChatToolCall
          v-for="(te, i) in toolEvents"
          :key="i"
          :event="te"
        />
      </template>

      <!-- Loading state -->
      <div
        v-if="isStreaming && !content && !reasoningContent && !(toolEvents && toolEvents.length)"
        class="inline-flex w-fit items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3"
        role="status"
        aria-label="正在加载回复"
      >
        <span class="size-2 rounded-full bg-emerald-200/90 animate-bounce" />
        <span
          class="size-2 rounded-full bg-emerald-200/70 animate-bounce"
          style="animation-delay: 120ms"
        />
        <span
          class="size-2 rounded-full bg-emerald-200/50 animate-bounce"
          style="animation-delay: 240ms"
        />
        <span class="sr-only">正在加载回复</span>
      </div>

      <!-- Text content  class="message-response rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 shadow-sm"-->
      <MessageResponse
        v-if="content"
        :content="content"
      />
    </MessageContent>
  </Message>
</template>
