<script setup lang="ts">
import { PromptInputHeader, usePromptInput } from '@/components/ai-elements/prompt-input'
import ChatAttachmentTile from './ChatAttachmentTile.vue'

const { files, removeFile } = usePromptInput()
</script>

<template>
  <PromptInputHeader
    v-if="files.length"
    class="overflow-visible border-b border-white/10 px-3 pb-2 pt-3"
  >
    <div class="flex w-full flex-wrap items-center gap-2 pb-0.5">
      <ChatAttachmentTile
        v-for="file in files"
        :key="file.id"
        :file="file"
        @remove="removeFile(file.id)"
      />
    </div>
  </PromptInputHeader>
</template>
