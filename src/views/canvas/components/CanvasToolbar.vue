<template>
  <aside
    class="absolute left-4 top-4 z-10 flex w-40 flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/95 p-3.5 shadow-xl shadow-black/40 backdrop-blur-sm"
  >
    <div class="mb-1 flex items-center justify-between gap-2">
      <RouterLink
        to="/"
        class="text-xs text-text-dim transition hover:text-accent-soft"
        title="返回项目列表"
      >
        ← 返回
      </RouterLink>
      <button
        type="button"
        class="rounded-md border border-border-muted bg-[#252932] px-2 py-0.5 text-[11px] text-text-muted transition hover:border-accent disabled:opacity-50"
        :disabled="saving"
        @click="$emit('save')"
      >
        {{ saving ? '保存中' : '保存' }}
      </button>
    </div>

    <div class="truncate text-xs font-semibold text-text-muted" :title="projectName">
      {{ projectName }}
    </div>

    <div class="text-[13px] font-semibold text-text-muted">
      添加节点
    </div>

    <button
      v-for="preset in presets"
      :key="preset.key"
      type="button"
      class="rounded-lg border border-border-muted bg-[#252932] px-3 py-2 text-[13px] text-text transition hover:border-accent hover:bg-[#2f3540]"
      @click="$emit('add-node', preset)"
    >
      {{ preset.label }}
    </button>

    <p class="mt-1 text-[11px] leading-snug text-text-dim">
      点击节点展开输入框
    </p>
    <p class="text-[11px] leading-snug text-text-dim">
      点击句柄添加并连接节点
    </p>
    <p class="text-[11px] leading-snug text-text-dim">
      画布空白处右键添加节点
    </p>
    <p class="text-[11px] leading-snug text-text-dim">
      画布空白处双击添加文本节点
    </p>
    <p class="text-[11px] leading-snug text-text-dim">
      选中后 Delete / Backspace 删除
    </p>
  </aside>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { NodePreset } from '@/types/canvas'

defineProps<{
  projectName: string
  saving: boolean
  presets: NodePreset[]
}>()

defineEmits<{
  'add-node': [preset: NodePreset]
  save: []
}>()
</script>
