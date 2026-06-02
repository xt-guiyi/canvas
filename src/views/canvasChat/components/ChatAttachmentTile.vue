<script setup lang="ts">
import type { AttachmentFile } from '@/components/ai-elements/prompt-input/types'
import { computed } from 'vue'
import {
  FileTextIcon,
  ImageIcon,
  Music2Icon,
  PaperclipIcon,
  VideoIcon,
  XIcon,
} from 'lucide-vue-next'
import { getAttachmentLabel, getMediaCategory } from '@/components/ai-elements/attachments/utils'

const props = defineProps<{
  file: AttachmentFile
}>()

const emit = defineEmits<{
  (e: 'remove'): void
}>()

const label = computed(() => getAttachmentLabel(props.file))
const mediaCategory = computed(() => getMediaCategory(props.file))
const fileUrl = computed(() => props.file.url)
const isImage = computed(() => mediaCategory.value === 'image' && !!fileUrl.value)
const isVideo = computed(() => mediaCategory.value === 'video' && !!fileUrl.value)

const fallbackIcon = computed(() => {
  if (mediaCategory.value === 'image') return ImageIcon
  if (mediaCategory.value === 'video') return VideoIcon
  if (mediaCategory.value === 'audio') return Music2Icon
  if (mediaCategory.value === 'document') return FileTextIcon
  return PaperclipIcon
})
</script>

<template>
  <div class="group/attachment relative size-12 shrink-0">
    <div
      class="absolute bottom-[calc(100%+10px)] left-0 z-40 hidden w-[min(11rem,calc(100vw-2rem))] overflow-hidden rounded-xl bg-[#303030] shadow-[0_18px_46px_rgba(0,0,0,0.42)] ring-1 ring-white/10 group-hover/attachment:block group-focus-within/attachment:block"
    >
      <div class="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#222]">
        <img
          v-if="isImage"
          :alt="label"
          class="size-full object-cover"
          :src="fileUrl"
        >
        <video
          v-else-if="isVideo"
          class="size-full object-cover"
          muted
          playsinline
          :src="fileUrl"
        />
        <component
          :is="fallbackIcon"
          v-else
          class="size-8 text-white/55"
        />
      </div>
      <div class="flex h-9 items-center px-3">
        <span class="truncate text-xs font-semibold leading-none text-white/88">
          {{ label }}
        </span>
      </div>
    </div>

    <div
      class="size-12 cursor-pointer overflow-hidden rounded-xl bg-white/[0.08] ring-1 ring-white/10"
      :title="label"
    >
      <img
        v-if="isImage"
        :alt="label"
        class="size-full object-cover"
        :src="fileUrl"
      >
      <video
        v-else-if="isVideo"
        class="size-full object-cover"
        muted
        playsinline
        :src="fileUrl"
      />
      <div
        v-else
        class="flex size-full items-center justify-center bg-white/[0.06]"
      >
        <component
          :is="fallbackIcon"
          class="size-5 text-white/60"
        />
      </div>
    </div>

    <button
      type="button"
      class="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.36)] ring-2 ring-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      aria-label="移除附件"
      @click.stop="emit('remove')"
    >
      <XIcon class="size-3.5" />
    </button>
  </div>
</template>
