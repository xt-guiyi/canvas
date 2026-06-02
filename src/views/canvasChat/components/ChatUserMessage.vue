<script setup lang="ts">
import {
  Message,
  MessageContent,
} from '@/components/ai-elements/message'
import type { ChatAttachment } from '@/types/chat'
import { FileTextIcon, Music2Icon, PaperclipIcon, VideoIcon } from 'lucide-vue-next'
import { computed } from 'vue'

interface Props {
  content: string
  attachments?: ChatAttachment[]
}

const props = defineProps<Props>()

function isImage(attachment: ChatAttachment): boolean {
  return attachment.mediaType.startsWith('image/')
}

function isVideo(attachment: ChatAttachment): boolean {
  return attachment.mediaType.startsWith('video/')
}

function iconFor(attachment: ChatAttachment) {
  if (attachment.mediaType.startsWith('video/')) return VideoIcon
  if (attachment.mediaType.startsWith('audio/')) return Music2Icon
  if (attachment.mediaType.startsWith('application/') || attachment.mediaType.startsWith('text/')) {
    return FileTextIcon
  }
  return PaperclipIcon
}

const hasContent = computed(() => props.content.trim().length > 0)
</script>

<template>
  <Message from="user">
    <MessageContent
      class="max-w-[86%] rounded-2xl rounded-br-md  bg-emerald-300/10 px-4 py-3 text-sm leading-7 text-foreground shadow-sm backdrop-blur sm:max-w-[72%]"
    >
      <div
        v-if="attachments?.length"
        class="mb-3 flex flex-wrap gap-2"
      >
        <div
          v-for="attachment in attachments"
          :key="attachment.url"
          class="size-16 overflow-hidden rounded-xl bg-black/25 ring-1 ring-white/10"
          :title="attachment.filename || attachment.mediaType"
        >
          <img
            v-if="isImage(attachment)"
            :alt="attachment.filename || '附件'"
            class="size-full object-cover"
            :src="attachment.url"
          >
          <video
            v-else-if="isVideo(attachment)"
            class="size-full object-cover"
            muted
            playsinline
            :src="attachment.url"
          />
          <div
            v-else
            class="flex size-full items-center justify-center"
          >
            <component
              :is="iconFor(attachment)"
              class="size-6 text-white/70"
            />
          </div>
        </div>
      </div>
      <span v-if="hasContent">{{ content }}</span>
    </MessageContent>
  </Message>
</template>
