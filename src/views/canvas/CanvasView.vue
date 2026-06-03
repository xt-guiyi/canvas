<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { MessageCircle } from 'lucide-vue-next'
import ChatView from '../canvasChat/ChatView.vue'
import CanvasContextMenu from './components/CanvasContextMenu.vue'
import CanvasToolbar from './components/CanvasToolbar.vue'
import InfiniteCanvas from './components/InfiniteCanvas.vue'
import MediaUploadButton from './components/MediaUploadButton.vue'
import NodeInputPanel from './components/NodeInputPanel.vue'
import { useCanvasContextMenu } from './composables/useCanvasContextMenu'
import type { HandleConnectFrom } from './composables/useCanvasContextMenu'
import { useMediaUploadButton } from './composables/useMediaUploadButton'
import { useNodePanel } from './composables/useNodePanel'
import { useCanvasStore } from '@/stores/canvas'
import { useCanvasLayoutStore } from '@/stores/canvasLayout'
import type { NodePreset } from '@/types/canvas'
import { getUpstreamMediaPreview } from '@/utils/canvasUtils/nodeGraph'
import { getPrimaryMediaUrl } from '@/utils/canvasUtils/nodeMedia'
import { getNodePrompt } from '@/utils/canvasUtils/nodeText'

const route = useRoute()
const canvasStore = useCanvasStore()
const layoutStore = useCanvasLayoutStore()
const canvasRef = useTemplateRef('canvasRef')
const isResizing = ref(false)

const chatPanelStyle = computed(() => ({
  width: `${layoutStore.clampedChatPanelWidth}px`,
}))

const canvasStyle = computed(() => ({
  backgroundColor: layoutStore.canvasBackground,
}))

const activeNode = computed(() => canvasStore.activeNode)
const activePrompt = computed(() => getNodePrompt(activeNode.value?.data))
const activeKind = computed(() => activeNode.value?.data?.kind ?? 'text')

const upstreamPreview = computed(() => {
  const node = activeNode.value
  if (!node) return null
  return getUpstreamMediaPreview(node.id, canvasStore.nodes, canvasStore.edges)
})

const showInputPanel = computed(() => {
  const node = activeNode.value
  if (!node?.data) return false
  if (node.data.kind === 'video' && getPrimaryMediaUrl(node.data)) return false
  return true
})

const showMediaUpload = computed(() => {
  const node = activeNode.value
  if (!node) return false
  const kind = node.data?.kind
  if (kind !== 'image' && kind !== 'video') return false
  if (kind === 'video' && getPrimaryMediaUrl(node.data)) return false
  return !canvasStore.isNodeConnected(node.id)
})

const { panelStyle, schedulePanelUpdate } = useNodePanel(activeNode)
const { uploadStyle, scheduleUploadUpdate } = useMediaUploadButton(
  activeNode,
  showMediaUpload,
)
const { menu: contextMenuState, openMenu, closeMenu } = useCanvasContextMenu()

const contextMenuTitle = computed(() =>
  contextMenuState.value?.connectFrom ? '添加并连接节点' : '添加节点',
)

let lastPaneClickTime = 0

function onPaneContextMenu(payload: { x: number; y: number }) {
  openMenu(payload)
}

function onHandleAddMenu(payload: { x: number; y: number; connectFrom: HandleConnectFrom }) {
  openMenu(payload)
}

function onContextMenuSelect(preset: NodePreset) {
  const state = contextMenuState.value
  if (!state) return
  if (state.connectFrom) {
    canvasRef.value?.addNodeConnected(preset, state.connectFrom)
  } else {
    canvasRef.value?.addNodeAtScreen(preset, state.x, state.y)
  }
  closeMenu()
}

function onSchedulePanel() {
  schedulePanelUpdate()
  scheduleUploadUpdate()
}

function onPaneInteraction() {
  closeMenu()
  const now = Date.now()
  if (now - lastPaneClickTime < 350) {
    canvasStore.addDefaultNode()
    lastPaneClickTime = 0
    return
  }
  lastPaneClickTime = now
  onSchedulePanel()
}

async function onMediaUpload(file: File) {
  const node = activeNode.value
  if (!node) return
  await canvasStore.uploadNodeMedia(node.id, file)
}

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

onMounted(async () => {
  const projectId = (route.params.projectId as string | undefined) ?? 'default'
  await canvasStore.loadProject(projectId)
  onSchedulePanel()
})
</script>

<template>
  <div class="dark relative h-dvh overflow-hidden bg-background text-foreground">
    <main class="h-full min-h-0">
      <section
        class="relative h-full w-full overflow-hidden transition-[margin] duration-300 ease-out"
        :style="canvasStyle"
      >
        <div
          v-if="canvasStore.loading"
          class="absolute inset-0 z-50 flex items-center justify-center bg-canvas-bg/80 text-text-muted"
        >
          加载画布中…
        </div>

        <CanvasToolbar
          :project-name="canvasStore.projectName"
          :saving="canvasStore.saving"
          :presets="canvasStore.nodePresets"
          @add-node="canvasStore.addNode"
          @save="canvasStore.saveCurrentProject"
        />

        <InfiniteCanvas
          ref="canvasRef"
          v-model:nodes="canvasStore.nodes"
          v-model:edges="canvasStore.edges"
          @connect="canvasStore.connect"
          @pane-interaction="onPaneInteraction"
          @pane-context-menu="onPaneContextMenu"
          @handle-add-menu="onHandleAddMenu"
          @schedule-panel="onSchedulePanel"
        />
      </section>
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

    <Teleport to="body">
      <CanvasContextMenu
        v-if="contextMenuState"
        :x="contextMenuState.x"
        :y="contextMenuState.y"
        :presets="canvasStore.nodePresets"
        :title="contextMenuTitle"
        @select="onContextMenuSelect"
      />
      <MediaUploadButton
        v-if="showMediaUpload && activeNode"
        :kind="activeKind"
        :style="uploadStyle"
        @upload="onMediaUpload"
      />
      <NodeInputPanel
        v-if="showInputPanel && canvasStore.activeNode"
        :key="canvasStore.activeNode.id"
        floating
        :panel-style="panelStyle"
        :prompt="activePrompt"
        :kind="activeKind"
        :model-label="canvasStore.panelConfig.modelLabel"
        :ref-label="canvasStore.panelConfig.refLabel"
        :spec-label="canvasStore.panelConfig.specLabel"
        :credits="canvasStore.panelConfig.credits"
        :upstream-preview="upstreamPreview"
        :loading="canvasStore.generatingNodeId === canvasStore.activeNode.id"
        @update:prompt="canvasStore.updateActivePrompt"
        @submit="canvasStore.submitActiveNode"
      />
    </Teleport>
  </div>
</template>
