<template>
  <div
    class="input-panel nodrag nopan nowheel relative w-[min(480px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
    :class="{ 'pointer-events-auto': floating }"
    :style="floating ? panelStyle : undefined"
    @mousedown.stop
    @click.stop
  >
    <button
      type="button"
      class="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-md text-zinc-600 transition hover:bg-white/5 hover:text-zinc-400"
      title="展开"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
      </svg>
    </button>

    <div class="flex items-center gap-2 px-3.5 pb-2 pt-3.5 pr-10">
      <div
        v-if="upstreamPreview"
        class="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-black"
        :title="upstreamPreview.kind === 'image' ? '上游图片' : '上游视频'"
      >
        <img
          v-if="upstreamPreview.kind === 'image'"
          :src="upstreamPreview.url"
          alt=""
          class="h-full w-full object-cover"
        />
        <video
          v-else
          :src="upstreamPreview.url"
          class="h-full w-full object-cover"
          muted
          playsinline
          preload="metadata"
        />
      </div>
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-800 text-lg text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-300"
        title="添加参考"
      >
        +
      </button>
    </div>

    <textarea
      ref="textareaRef"
      :value="prompt"
      class="ui-scrollbar min-h-[88px] w-full resize-none border-0 bg-transparent px-3.5 pb-2 text-[13px] leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600"
      rows="3"
      placeholder="描述任何你想要生成的内容"
      :disabled="loading"
      @input="onInput"
    />

    <div class="flex items-center justify-between gap-2 border-t border-zinc-800/80 bg-zinc-950/50 px-3.5 py-2.5">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <button type="button" class="truncate text-xs font-medium text-zinc-300 transition hover:text-white">
          {{ modelLabel }}
        </button>
        <button
          type="button"
          class="flex items-center gap-1 truncate text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          {{ specLabel }}
        </button>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <!-- <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
          title="语音输入"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
            <path d="M19 11v1a7 7 0 0 1-14 0v-1M12 18v3" stroke-linecap="round" />
          </svg>
        </button>
        <button
          type="button"
          class="rounded-md px-2 py-1 text-xs text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
        >
          1x
        </button> -->
        <div class="flex items-center gap-1 text-xs text-zinc-500">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" class="text-zinc-600">
            <circle cx="8" cy="8" r="6" opacity="0.3" />
            <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 1.5v2.5l2 1" />
          </svg>
          <span>{{ credits }}</span>
        </div>
        <button
          type="button"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-zinc-200 transition hover:bg-zinc-600 disabled:opacity-40"
          title="生成"
          :disabled="loading"
          @click="$emit('submit')"
        >
          <svg
            v-if="loading"
            class="animate-spin"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="9" stroke-opacity="0.25" />
            <path d="M12 3a9 9 0 0 1 9 9" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { NodeKind, UpstreamMediaPreview } from '@/types/canvas'

const props = withDefaults(
  defineProps<{
    prompt?: string
    kind?: NodeKind
    upstreamPreview?: UpstreamMediaPreview | null
    modelLabel?: string
    refLabel?: string
    specLabel?: string
    credits?: number
    autoFocus?: boolean
    floating?: boolean
    loading?: boolean
    panelStyle?: Record<string, string>
  }>(),
  {
    prompt: '',
    kind: 'text',
    upstreamPreview: null,
    modelLabel: 'Seedance 2.0',
    refLabel: '全能参考',
    specLabel: '16:9 · 720p · 5s',
    credits: 120,
    autoFocus: true,
    floating: false,
    loading: false,
    panelStyle: () => ({}),
  }
)

const emit = defineEmits<{
  'update:prompt': [value: string]
  submit: []
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:prompt', target.value)
}

watch(
  () => props.autoFocus,
  async focus => {
    if (!focus) return
    await nextTick()
    textareaRef.value?.focus()
  },
  { immediate: true }
)
</script>
