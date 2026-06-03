<template>
  <div
    class="canvas-context-menu fixed z-[100] min-w-[140px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/95 py-1 shadow-xl shadow-black/40 backdrop-blur-sm"
    :style="{ left: `${x}px`, top: `${y}px` }"
    @mousedown.stop
    @contextmenu.prevent
  >
    <div class="px-3 py-1.5 text-[11px] font-medium text-zinc-500">
      {{ title }}
    </div>
    <button
      v-for="preset in presets"
      :key="preset.key"
      type="button"
      class="flex w-full items-center px-3 py-2 text-left text-[13px] text-zinc-200 transition hover:bg-white/5"
      @click="$emit('select', preset)"
    >
      {{ preset.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { NodePreset } from '@/types/canvas'

withDefaults(
  defineProps<{
    x: number
    y: number
    presets: NodePreset[]
    title?: string
  }>(),
  { title: '添加节点' },
)

defineEmits<{
  select: [preset: NodePreset]
}>()
</script>
