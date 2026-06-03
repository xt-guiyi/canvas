<template>
  <VueFlow
    v-model:nodes="nodes"
    v-model:edges="edges"
    class="canvas-flow h-full w-full bg-canvas-bg"
    :min-zoom="0.1"
    :max-zoom="2"
    :delete-key-code="['Backspace', 'Delete']"
    :connect-on-click="false"
    elevate-nodes-on-select
    fit-view-on-init
    @connect="onConnect"
    @connect-start="onConnectStart"
    @connect-end="onConnectEnd"
    @pane-click="onPaneClick"
    @pane-context-menu="onPaneContextMenu"
    @pane-ready="onPaneReady"
    @node-click="onNodeClick"
    @node-drag="emitSchedulePanel"
    @viewport-change="emitSchedulePanel"
  >
    <Background variant="dots" pattern-color="#2a2a2e" :gap="24" :size="1.5" />
    <MiniMap />
    <Controls />

    <template #node-ai="nodeProps">
      <AiNode v-bind="nodeProps" />
    </template>
  </VueFlow>
</template>

<script setup lang="ts">
import { nextTick, shallowRef } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import { Controls } from '@vue-flow/controls'
import type { Connection, NodeMouseEvent, VueFlowStore } from '@vue-flow/core'
import AiNode from './AiNode.vue'
import { useSelectionHighlight } from '../composables/useSelectionHighlight'
import type { HandleConnectFrom } from '../composables/useCanvasContextMenu'
import { useCanvasStore } from '@/stores/canvas'
import { getConnectedNodePosition } from '@/utils/canvasUtils/nodeLayout'
import type { AiFlowNode, CanvasEdge, NodePreset } from '@/types/canvas'

const HANDLE_CLICK_THRESHOLD = 5

const nodes = defineModel<AiFlowNode[]>('nodes', { required: true })
const edges = defineModel<CanvasEdge[]>('edges', { required: true })

const canvasStore = useCanvasStore()
const flowInstance = shallowRef<VueFlowStore | null>(null)
const { syncHighlight } = useSelectionHighlight(nodes, edges)

let pendingHandleConnect: (HandleConnectFrom & { x: number; y: number }) | null = null
let connectionMade = false

const emit = defineEmits<{
  connect: [params: Connection]
  'pane-interaction': []
  'pane-context-menu': [payload: { x: number; y: number }]
  'handle-add-menu': [payload: { x: number; y: number; connectFrom: HandleConnectFrom }]
  'schedule-panel': []
}>()

function onPaneReady(instance: VueFlowStore) {
  flowInstance.value = instance
}

function applyHighlight(id: string | null) {
  nextTick(() => {
    syncHighlight(id)
    nextTick(() => syncHighlight(id))
  })
}

function screenToFlow(clientX: number, clientY: number) {
  return (
    flowInstance.value?.screenToFlowCoordinate({ x: clientX, y: clientY }) ?? {
      x: clientX,
      y: clientY,
    }
  )
}

function addNodeAtScreen(preset: NodePreset, clientX: number, clientY: number) {
  const flowPosition = screenToFlow(clientX, clientY)
  const node = canvasStore.addNode(preset, flowPosition)
  applyHighlight(node.id)
  emit('schedule-panel')
}

function addNodeConnected(preset: NodePreset, connectFrom: HandleConnectFrom) {
  const sourceNode = nodes.value.find(n => n.id === connectFrom.nodeId)
  let node: AiFlowNode

  if (sourceNode?.data) {
    const position = getConnectedNodePosition(
      sourceNode.position,
      sourceNode,
      preset.key,
      connectFrom.handleType,
    )
    node = canvasStore.addNode(preset, position)
    if (connectFrom.handleType === 'source') {
      canvasStore.connect({ source: connectFrom.nodeId, target: node.id })
    } else {
      canvasStore.connect({ source: node.id, target: connectFrom.nodeId })
    }
  } else {
    node = canvasStore.addNode(preset)
  }

  applyHighlight(node.id)
  emit('schedule-panel')
}

function onConnectStart(params: {
  event?: MouseEvent | TouchEvent
  nodeId?: string
  handleType?: 'source' | 'target'
}) {
  connectionMade = false
  const event = params.event
  if (!params.nodeId || !params.handleType || !event || !('clientX' in event)) return

  pendingHandleConnect = {
    nodeId: params.nodeId,
    handleType: params.handleType,
    x: event.clientX,
    y: event.clientY,
  }
}

function isHandleEvent(event: MouseEvent | TouchEvent) {
  const target = event.target as HTMLElement | null
  return Boolean(target?.closest?.('.vue-flow__handle'))
}

function onConnectEnd(event?: MouseEvent | TouchEvent) {
  const pending = pendingHandleConnect
  pendingHandleConnect = null

  if (!pending || connectionMade || !event || !('clientX' in event)) return

  const dx = Math.abs(event.clientX - pending.x)
  const dy = Math.abs(event.clientY - pending.y)
  if (dx >= HANDLE_CLICK_THRESHOLD || dy >= HANDLE_CLICK_THRESHOLD) return

  canvasStore.clearSelection()
  applyHighlight(null)
  emit('handle-add-menu', {
    x: event.clientX,
    y: event.clientY,
    connectFrom: {
      nodeId: pending.nodeId,
      handleType: pending.handleType,
    },
  })
}

function onConnect(params: Connection) {
  connectionMade = true
  emit('connect', params)
  if (canvasStore.selectedNodeId) {
    applyHighlight(canvasStore.selectedNodeId)
  }
}

function onPaneClick() {
  canvasStore.clearSelection()
  applyHighlight(null)
  emit('pane-interaction')
}

function onPaneContextMenu(event: MouseEvent) {
  event.preventDefault()
  canvasStore.clearSelection()
  applyHighlight(null)
  emit('pane-context-menu', { x: event.clientX, y: event.clientY })
}

function onNodeClick(event: NodeMouseEvent) {
  if (event.event && isHandleEvent(event.event)) return
  canvasStore.selectNode(event.node.id)
  applyHighlight(event.node.id)
  emit('schedule-panel')
}

function emitSchedulePanel() {
  emit('schedule-panel')
}

defineExpose({ addNodeAtScreen, addNodeConnected })
</script>
