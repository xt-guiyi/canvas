<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { MessageCircle } from 'lucide-vue-next'
import ChatView from './canvasChat/ChatView.vue'
import { useCanvasLayoutStore } from '@/stores/canvasLayout'

const layoutStore = useCanvasLayoutStore()
const isResizing = ref(false)

const chatPanelStyle = computed(() => ({
  width: `${layoutStore.clampedChatPanelWidth}px`,
}))

const canvasStyle = computed(() => ({
  backgroundColor: layoutStore.canvasBackground,
}))

function handlePointerMove(event: PointerEvent) {
  if (!isResizing.value) return

  const nextWidth = window.innerWidth - event.clientX
  layoutStore.setChatPanelWidth(nextWidth)
}

function stopResize() {
  isResizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', stopResize)
}

function startResize(event: PointerEvent) {
  event.preventDefault()
  isResizing.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopResize)
}

onBeforeUnmount(stopResize)
</script>

<template>
  <div class="dark relative h-dvh overflow-hidden bg-background text-foreground">
    <main class="h-full min-h-0">
      <section
        class="relative h-full w-full overflow-hidden transition-[margin] duration-300 ease-out"
        :style="canvasStyle"
      />
    </main>

    <button
      v-if="!layoutStore.chatPanelOpen"
      type="button"
      class="absolute right-6 top-1/2 z-30 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-background/85 text-foreground shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur transition hover:bg-background"
      aria-label="打开聊天"
      @click="layoutStore.openChatPanel"
    >
      <MessageCircle class="size-5" />
    </button>

    <aside
      v-if="layoutStore.chatPanelOpen"
      class="absolute inset-y-0 right-0 z-40 flex min-h-0 border-l border-white/10 bg-background shadow-[-22px_0_55px_rgba(0,0,0,0.28)] transition-transform duration-300 ease-out"
      :style="chatPanelStyle"
    >
      <div
        class="absolute inset-y-0 left-0 z-50 w-2 -translate-x-1 cursor-col-resize"
        role="separator"
        aria-orientation="vertical"
        :aria-valuemin="layoutStore.minChatWidth"
        :aria-valuemax="layoutStore.maxChatWidth"
        :aria-valuenow="layoutStore.clampedChatPanelWidth"
        @pointerdown="startResize"
      >
        <div
          class="mx-auto h-full w-px bg-white/10 transition"
          :class="isResizing ? 'bg-emerald-300/70' : 'hover:bg-white/30'"
        />
      </div>

      <ChatView class="min-w-0 flex-1" @close="layoutStore.closeChatPanel" />
    </aside>
  </div>
</template>
