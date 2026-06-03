<template>
  <div class="ai-node flex flex-col overflow-visible">
    <div class="ai-node__header mb-2 flex shrink-0 items-center gap-[2px] text-xs text-zinc-500">
      <svg
        v-if="kind === 'text'"
        class="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.25"
      >
        <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h7" stroke-linecap="round" />
      </svg>
      <svg
        v-else-if="kind === 'image'"
        class="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.25"
      >
        <rect x="2" y="2" width="12" height="12" rx="1.5" />
        <circle cx="5.5" cy="5.5" r="1" fill="currentColor" stroke="none" />
        <path d="M14 11l-3.5-3.5L4 14" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <svg
        v-else-if="kind === 'video'"
        class="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.25"
      >
        <rect x="2" y="3" width="12" height="10" rx="1.5" />
        <path d="M7 6.5v3l3-1.5-3-1.5z" fill="currentColor" stroke="none" />
      </svg>
      <span class="font-medium tracking-wide text-xs">{{ styleConfig.label }}</span>
    </div>

    <div class="ai-node__shell relative overflow-visible">
      <div
        class="ai-node__body relative box-border shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90 transition-[border-color,box-shadow] duration-200"
        :class="[bodyClass, { 'p-0': hasMedia }]"
        :style="bodyStyle"
      >
        <div
          v-if="data.status === 'loading'"
          class="absolute right-2.5 top-2.5 z-10 h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-300"
        />
        <div v-else-if="data.status === 'success'" class="absolute right-2.5 top-2.5 z-10 text-[10px] text-emerald-500">
          ✓
        </div>
        <div v-else-if="data.status === 'error'" class="absolute right-2.5 top-2.5 z-10 text-[10px] text-red-400">
          !
        </div>

        <div v-if="kind === 'text'" class="flex h-full flex-col overflow-hidden" @dblclick.stop="startEdit">
          <textarea
            v-if="isEditing"
            ref="textareaRef"
            v-model="draft"
            class="ui-scrollbar nodrag nopan nowheel h-full min-h-0 w-full resize-none border-0 bg-transparent p-2 text-[13px] leading-relaxed text-zinc-300 outline-none placeholder:text-zinc-600"
            :placeholder="styleConfig.placeholder"
            @blur="commitEdit"
            @keydown="onEditKeydown"
            @mousedown.stop
            @click.stop
          />
          <p
            v-else
            class="ui-scrollbar nowheel h-full min-h-0 cursor-text select-none overflow-y-auto text-[13px] leading-relaxed break-words whitespace-pre-wrap p-2"
            :class="hasContent ? 'text-zinc-300' : 'text-zinc-600'"
          >
            {{ viewText }}
          </p>
        </div>

        <div v-else-if="kind === 'image'" class="h-full w-full">
          <img v-if="hasMedia" :src="primaryMediaUrl" alt="" class="h-full w-full object-cover" />
          <div v-else class="flex h-full items-center justify-center p-4">
            <svg
              class="h-12 w-12 text-zinc-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.25"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
              <path d="M21 15l-5-5L5 21" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </div>

        <div
          v-else-if="kind === 'video'"
          ref="videoContainerRef"
          class="ai-node__video nopan nowheel relative h-full w-full"
          @mouseenter="onVideoEnter"
          @mouseleave="onVideoLeave"
        >
          <video
            v-if="hasMedia"
            ref="videoRef"
            :src="primaryMediaUrl"
            class="nopan nowheel block h-full w-full object-cover"
            muted
            playsinline
            loop
            preload="metadata"
            @click.prevent
          />
          <VideoNodeControls
            v-if="hasMedia && isVideoHovering"
            :video="videoRef"
            :container="videoContainerRef"
          />
          <div v-else class="flex h-full items-center justify-center p-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-800/60">
              <svg class="ml-0.5 h-6 w-6 text-zinc-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <Handle type="target" :position="Position.Left" class="ai-node__handle" @mousedown.stop @click.stop />
      <Handle type="source" :position="Position.Right" class="ai-node__handle" @mousedown.stop @click.stop />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { DEFAULT_NODE_BODY_SIZE, NODE_STYLE } from '@/views/canvas/constants/nodeStyles'
import { useCanvasStore } from '@/stores/canvas'
import VideoNodeControls from './VideoNodeControls.vue'
import { getPrimaryMediaUrl } from '@/utils/canvasUtils/nodeMedia'
import { getNodeContent } from '@/utils/canvasUtils/nodeText'
import type { AiNodeData, NodeKind } from '@/types/canvas'

const props = defineProps<{
  id: string
  data: AiNodeData
}>()

const canvasStore = useCanvasStore()

const isEditing = ref(false)
const draft = ref('')
const pendingDisplay = ref<string | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const videoContainerRef = ref<HTMLElement | null>(null)
const isVideoHovering = ref(false)

const kind = computed<NodeKind>(() => props.data.kind ?? 'text')
const styleConfig = computed(() => NODE_STYLE[kind.value])

const primaryMediaUrl = computed(() => getPrimaryMediaUrl(props.data))
const hasMedia = computed(() => Boolean(primaryMediaUrl.value))

const bodySize = computed(
  () => props.data.mediaSize ?? DEFAULT_NODE_BODY_SIZE[kind.value],
)

const bodyStyle = computed(() => ({
  width: `${bodySize.value.width}px`,
  height: `${bodySize.value.height}px`,
}))

const bodyClass = computed(() => {
  if (kind.value === 'text') return styleConfig.value.bodyClass
  return ''
})

const resolvedText = computed(() => {
  if (isEditing.value) return draft.value
  if (pendingDisplay.value !== null) return pendingDisplay.value
  return getNodeContent(props.data)
})

const hasContent = computed(() => resolvedText.value.trim().length > 0)

const viewText = computed(() => {
  const text = resolvedText.value.trim()
  if (!text) return styleConfig.value.placeholder
  return text
})

function onVideoEnter() {
  isVideoHovering.value = true
  if (!hasMedia.value) return
  void videoRef.value?.play()
}

function onVideoLeave() {
  isVideoHovering.value = false
  const video = videoRef.value
  if (!video) return
  video.pause()
}

function pauseVideo() {
  isVideoHovering.value = false
  const video = videoRef.value
  if (!video) return
  video.pause()
}

function startEdit() {
  if (kind.value !== 'text' || isEditing.value) return
  draft.value = pendingDisplay.value ?? getNodeContent(props.data)
  pendingDisplay.value = null
  isEditing.value = true
  nextTick(() => {
    const el = textareaRef.value
    if (!el) return
    el.focus()
    el.select()
  })
}

function commitEdit() {
  if (!isEditing.value) return
  const value = draft.value
  pendingDisplay.value = value
  canvasStore.patchNodeData(props.id, { content: value })
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
  pendingDisplay.value = null
}

function onEditKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    cancelEdit()
    return
  }
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    commitEdit()
  }
}

watch(
  () => primaryMediaUrl.value,
  () => pauseVideo()
)

watch(
  () => props.data.content,
  content => {
    if (isEditing.value) return
    if (pendingDisplay.value !== null && content === pendingDisplay.value) {
      pendingDisplay.value = null
    }
    if (pendingDisplay.value === null) {
      draft.value = getNodeContent(props.data)
    }
  }
)
</script>
