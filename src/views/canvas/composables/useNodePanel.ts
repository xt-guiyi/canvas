import { ref, watch, nextTick, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue'
import type { AiFlowNode } from '@/types/canvas'

const MAX_POSITION_RETRIES = 10

export function useNodePanel(activeNode: ComputedRef<AiFlowNode | undefined>) {
  const panelStyle = ref<Record<string, string>>({ visibility: 'hidden' })

  let panelRaf = 0

  function updatePanelPosition(retry = 0) {
    const node = activeNode.value
    if (!node) {
      panelStyle.value = { visibility: 'hidden' }
      return
    }

    const card = document.querySelector(
      `.vue-flow__node[data-id="${CSS.escape(node.id)}"] .ai-node`,
    )
    if (!card) {
      if (retry < MAX_POSITION_RETRIES) {
        panelRaf = requestAnimationFrame(() => updatePanelPosition(retry + 1))
      } else {
        panelStyle.value = { visibility: 'hidden' }
      }
      return
    }

    const rect = card.getBoundingClientRect()
    panelStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 12}px`,
      left: `${rect.left + rect.width / 2}px`,
      transform: 'translateX(-50%)',
      zIndex: '10000',
      visibility: 'visible',
    }
  }

  function schedulePanelUpdate() {
    cancelAnimationFrame(panelRaf)
    panelRaf = requestAnimationFrame(() => {
      // 双 nextTick：等待 v-if 挂载输入框 + 节点 DOM 更新
      nextTick(() => {
        nextTick(() => updatePanelPosition())
      })
    })
  }

  watch(activeNode, () => schedulePanelUpdate(), { flush: 'post' })

  onMounted(() => {
    window.addEventListener('resize', schedulePanelUpdate)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', schedulePanelUpdate)
    cancelAnimationFrame(panelRaf)
  })

  return {
    panelStyle: panelStyle as Ref<Record<string, string>>,
    schedulePanelUpdate,
  }
}
