<template>
  <div
    class="pointer-events-auto"
    :style="style"
    @mousedown.stop
    @click.stop
  >
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 text-xs text-zinc-300 shadow-lg transition hover:border-zinc-600 hover:bg-zinc-700 hover:text-white"
      @click="openFilePicker"
    >
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M8 11V3M5 6l3-3 3 3" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M3 13h10" stroke-linecap="round" />
      </svg>
      上传
    </button>
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      :accept="accept"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  getAcceptForKind,
  toMediaKind,
  validateMediaFile,
} from '@/utils/canvasUtils/nodeMedia'
import type { NodeKind } from '@/types/canvas'

const props = defineProps<{
  kind: NodeKind
  style?: Record<string, string>
}>()

const emit = defineEmits<{
  upload: [file: File]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const mediaKind = computed(() => toMediaKind(props.kind))

const accept = computed(() => {
  if (!mediaKind.value) return ''
  return getAcceptForKind(mediaKind.value)
})

function openFilePicker() {
  if (!mediaKind.value) return
  fileInputRef.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !mediaKind.value) return

  const error = validateMediaFile(file, mediaKind.value)
  if (error) {
    window.alert(error)
    return
  }

  emit('upload', file)
}
</script>
