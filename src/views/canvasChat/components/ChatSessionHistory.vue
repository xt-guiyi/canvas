<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Search, Trash2 } from 'lucide-vue-next'
import type { ChatSession } from '@/types/chat'

const props = defineProps<{
  sessions: ChatSession[]
  currentSessionId?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'delete', id: string): void
  (e: 'close'): void
}>()

const query = ref('')
const panelRef = ref<HTMLElement | null>(null)

const filteredSessions = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return [...props.sessions]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter(session => session.title.toLowerCase().includes(keyword))
})

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} 分`
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))} 小时`
  return `${Math.max(1, Math.floor(diff / day))} 天`
}

function handleSelect(id: string) {
  emit('select', id)
  emit('close')
}

function handleOutsidePointerDown(event: PointerEvent) {
  const target = event.target
  if (!(target instanceof Node)) return
  if (panelRef.value?.contains(target)) return

  emit('close')
}

onMounted(() => {
  nextTick(() => {
    document.addEventListener('pointerdown', handleOutsidePointerDown, true)
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsidePointerDown, true)
})
</script>

<template>
  <div class="absolute inset-x-0 bottom-0 top-14 z-50 px-2 pb-3">
    <div
      ref="panelRef"
      class="flex max-h-[min(560px,calc(100dvh-5rem))] min-h-[310px] w-full flex-col overflow-hidden rounded-[24px] bg-[#343434] shadow-[0_24px_80px_rgba(0,0,0,0.42)] ring-1 ring-white/[0.06]"
    >
      <label class="mx-4 mt-3 flex h-12 shrink-0 items-center gap-2.5 rounded-2xl bg-[#2b2b2b] px-3 text-white/48 ring-1 ring-white/[0.04]">
        <Search class="size-4 shrink-0 stroke-[2.2]" />
        <input
          v-model="query"
          class="h-full min-w-0 flex-1 bg-transparent text-[13px] font-medium text-white/86 outline-none placeholder:text-white/42"
          placeholder="搜索最近任务"
          autofocus
        >
      </label>

      <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-3">
        <button
          v-for="session in filteredSessions"
          :key="session.id"
          type="button"
          class="group grid min-h-10 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-white/76 transition-colors hover:bg-white/[0.055] hover:text-white disabled:pointer-events-none disabled:opacity-55"
          :disabled="disabled"
          @click="handleSelect(session.id)"
        >
          <span class="min-w-0 truncate text-[13px] font-semibold leading-5 tracking-normal">
            {{ session.title }}
          </span>
          <span class="flex shrink-0 items-center justify-end gap-1.5 text-[11px] font-medium text-white/42">
            <span class="min-w-8 text-right">{{ formatRelativeTime(session.updatedAt) }}</span>
            <button
              type="button"
              class="flex size-6 items-center justify-center rounded-lg text-white/0 transition-colors hover:text-white/78 group-hover:text-white/36"
              :disabled="disabled"
              aria-label="删除会话"
              @click.stop="emit('delete', session.id)"
            >
              <Trash2 class="size-3.5 stroke-[2.2]" />
            </button>
          </span>
        </button>

        <div
          v-if="filteredSessions.length === 0"
          class="flex h-32 items-center justify-center text-[13px] font-medium text-white/42"
        >
          暂无匹配任务
        </div>
      </div>
    </div>
  </div>
</template>
