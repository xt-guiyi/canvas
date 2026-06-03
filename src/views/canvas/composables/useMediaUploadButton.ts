import { ref, watch, nextTick, onMounted, onUnmounted, type ComputedRef } from 'vue'
import type { AiFlowNode } from '@/types/canvas'

const MAX_RETRIES = 10

export function useMediaUploadButton(activeNode: ComputedRef<AiFlowNode | undefined>, visible: ComputedRef<boolean>) {
  const uploadStyle = ref<Record<string, string>>({ visibility: 'hidden' })

  let raf = 0

  function updatePosition(retry = 0) {
    if (!visible.value || !activeNode.value) {
      uploadStyle.value = { visibility: 'hidden' }
      return
    }

    const body = document.querySelector(`.vue-flow__node[data-id="${CSS.escape(activeNode.value.id)}"] .ai-node__body`)
    if (!body) {
      if (retry < MAX_RETRIES) {
        raf = requestAnimationFrame(() => updatePosition(retry + 1))
      }
      return
    }

    const rect = body.getBoundingClientRect()
    uploadStyle.value = {
      position: 'fixed',
      top: `${rect.top - 50}px`,
      left: `${rect.left + rect.width / 2}px`,
      transform: 'translateX(-50%)',
      zIndex: '10001',
      visibility: 'visible',
    }
  }

  function scheduleUpdate() {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      nextTick(() => updatePosition())
    })
  }

  watch([activeNode, visible], scheduleUpdate, { flush: 'post' })

  onMounted(() => {
    window.addEventListener('resize', scheduleUpdate)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', scheduleUpdate)
    cancelAnimationFrame(raf)
  })

  return { uploadStyle, scheduleUploadUpdate: scheduleUpdate }
}
