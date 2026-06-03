import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Connection } from '@vue-flow/core'
import { canvasApi } from '@/api/canvas'
import { NODE_PRESETS, PANEL_CONFIG } from '@/views/canvas/constants/nodePresets'
import { getNodePrompt } from '@/utils/canvasUtils/nodeText'
import { getConnectedNodePosition } from '@/utils/canvasUtils/nodeLayout'
import { normalizeNodeMediaData } from '@/utils/canvasUtils/nodeMedia'
import type { AiFlowNode, AiNodeData, CanvasEdge, CanvasProject, NodeKind, NodePreset } from '@/types/canvas'

export const useCanvasStore = defineStore('canvas', () => {
  const projectId = ref('default')
  const projectName = ref('默认画布')
  const nodes = ref<AiFlowNode[]>([])
  const edges = ref<CanvasEdge[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const generatingNodeId = ref<string | null>(null)
  const selectedNodeId = ref<string | null>(null)

  let nodeIdCounter = 10

  const activeNode = computed((): AiFlowNode | undefined => {
    if (selectedNodeId.value) {
      return nodes.value.find(n => n.id === selectedNodeId.value)
    }
    return nodes.value.find(n => n.selected)
  })

  const panelConfig = computed(() => {
    const kind: NodeKind = activeNode.value?.data?.kind ?? 'text'
    return PANEL_CONFIG[kind] ?? PANEL_CONFIG.text
  })

  const nodePresets = computed(() => NODE_PRESETS)

  function nextNodeId(): string {
    return String(nodeIdCounter++)
  }

  function createNode(preset: NodePreset, position: { x: number; y: number }): AiFlowNode {
    return {
      id: nextNodeId(),
      type: 'ai',
      position,
      data: {
        kind: preset.key,
        ...preset.data,
      },
    }
  }

  function addNode(preset: NodePreset, position?: { x: number; y: number }) {
    const offset = nodes.value.length * 50
    const pos = position ?? { x: 200 + offset, y: 150 + offset }
    const node = createNode(preset, pos)
    nodes.value.push(node)
    nodes.value.forEach(n => {
      n.selected = n.id === node.id
    })
    selectNode(node.id)
    return node
  }

  function addConnectedNode(
    preset: NodePreset,
    from: { nodeId: string; handleType: 'source' | 'target' },
  ) {
    const sourceNode = nodes.value.find(n => n.id === from.nodeId)
    if (!sourceNode?.data) return addNode(preset)

    const position = getConnectedNodePosition(
      sourceNode.position,
      sourceNode,
      preset.key,
      from.handleType,
    )
    const node = addNode(preset, position)

    if (from.handleType === 'source') {
      connect({ source: from.nodeId, target: node.id })
    } else {
      connect({ source: node.id, target: from.nodeId })
    }

    return node
  }

  function addDefaultNode() {
    addNode(NODE_PRESETS[0]!)
  }

  function connect(params: Connection) {
    if (!params.source || !params.target) return
    const exists = edges.value.some(
      e => e.source === params.source && e.target === params.target,
    )
    if (exists) return
    edges.value.push({
      id: `e${params.source}-${params.target}`,
      source: params.source,
      target: params.target,
      animated: true,
    })
  }

  function selectNode(id: string) {
    selectedNodeId.value = id
    nodes.value.forEach(n => {
      n.selected = n.id === id
    })
  }

  function clearSelection() {
    selectedNodeId.value = null
    nodes.value.forEach(n => {
      n.selected = false
    })
  }

  function isNodeConnected(nodeId: string): boolean {
    return edges.value.some(e => e.source === nodeId || e.target === nodeId)
  }

  async function uploadNodeMedia(nodeId: string, file: File) {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node?.data) return
    const kind = node.data.kind
    if (kind !== 'image' && kind !== 'video') return

    const {
      validateMediaFile,
      readFileAsDataUrl,
      buildMediaUploadPayload,
    } = await import('@/utils/canvasUtils/nodeMedia')
    const mediaKind = kind as 'image' | 'video'
    const error = validateMediaFile(file, mediaKind)
    if (error) {
      window.alert(error)
      return
    }

    const url = await readFileAsDataUrl(file)
    const { upload, mediaSize, mediaUrl } = await buildMediaUploadPayload(file, mediaKind, url)
    patchNodeData(nodeId, {
      mediaUrl,
      uploads: [upload],
      mediaSize,
    })
  }

  function patchNodeData(id: string, patch: Partial<AiNodeData>) {
    const node = nodes.value.find(n => n.id === id)
    if (!node?.data) return
    Object.assign(node.data, patch)
  }

  function updateActivePrompt(value: string) {
    const node = activeNode.value
    if (!node) return
    patchNodeData(node.id, { prompt: value })
  }

  async function submitActiveNode() {
    const node = activeNode.value
    if (!node) return

    const data = node.data
    const prompt = getNodePrompt(data).trim()
    if (!prompt) return

    generatingNodeId.value = node.id
    patchNodeData(node.id, { status: 'loading' })

    try {
      const result = await canvasApi.generate({
        nodeId: node.id,
        kind: data?.kind ?? 'text',
        prompt,
      })
      // Text 节点：生成结果不写入 content，避免覆盖节点内双击编辑的文本
      if (data?.kind === 'text') {
        patchNodeData(result.nodeId, { status: result.status })
      } else {
        patchNodeData(result.nodeId, { content: result.content, status: result.status })
      }
    } catch {
      patchNodeData(node.id, { status: 'error' })
    } finally {
      generatingNodeId.value = null
    }
  }

  function applyProject(project: CanvasProject) {
    projectId.value = project.id
    projectName.value = project.name
    selectedNodeId.value = null
    nodes.value = (JSON.parse(JSON.stringify(project.nodes)) as AiFlowNode[]).map(node => ({
      ...node,
      data: normalizeNodeMediaData(node.data),
    }))
    edges.value = JSON.parse(JSON.stringify(project.edges)) as CanvasEdge[]
    const maxId = nodes.value.reduce((max, n) => {
      const num = Number.parseInt(n.id, 10)
      return Number.isFinite(num) ? Math.max(max, num) : max
    }, 0)
    nodeIdCounter = maxId + 1
  }

  async function loadProject(id: string) {
    loading.value = true
    try {
      const stored = localStorage.getItem(`canvas_project_${id}`)
      if (stored) {
        applyProject(JSON.parse(stored) as CanvasProject)
        return
      }
      const project = await canvasApi.getProject(id)
      applyProject(project)
    } finally {
      loading.value = false
    }
  }

  async function saveCurrentProject() {
    saving.value = true
    try {
      const project: CanvasProject = {
        id: projectId.value,
        name: projectName.value,
        nodes: JSON.parse(JSON.stringify(nodes.value)) as AiFlowNode[],
        edges: JSON.parse(JSON.stringify(edges.value)) as CanvasEdge[],
        updatedAt: new Date().toISOString(),
      }
      await canvasApi.saveProject(project)
    } finally {
      saving.value = false
    }
  }

  function resetCanvas() {
    nodes.value = []
    edges.value = []
    selectedNodeId.value = null
    nodeIdCounter = 1
  }

  return {
    projectId,
    projectName,
    nodes,
    edges,
    loading,
    saving,
    generatingNodeId,
    selectedNodeId,
    activeNode,
    panelConfig,
    nodePresets,
    addNode,
    addConnectedNode,
    addDefaultNode,
    connect,
    selectNode,
    clearSelection,
    isNodeConnected,
    uploadNodeMedia,
    patchNodeData,
    updateActivePrompt,
    submitActiveNode,
    loadProject,
    saveCurrentProject,
    resetCanvas,
  }
})
