import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useCanvasLayoutStore = defineStore('canvasLayout', () => {
  const canvasBackground = ref('#111318')
  const chatPanelOpen = ref(false)
  const defaultChatWidth = ref(400)
  const minChatWidth = ref(300)
  const maxChatWidth = ref(600)
  const chatPanelWidth = ref(defaultChatWidth.value)

  const clampedChatPanelWidth = computed(() =>
    Math.min(maxChatWidth.value, Math.max(minChatWidth.value, chatPanelWidth.value)),
  )

  function openChatPanel() {
    chatPanelOpen.value = true
  }

  function closeChatPanel() {
    chatPanelOpen.value = false
  }

  function setChatPanelWidth(width: number) {
    chatPanelWidth.value = Math.min(maxChatWidth.value, Math.max(minChatWidth.value, width))
  }

  return {
    canvasBackground,
    chatPanelOpen,
    defaultChatWidth,
    minChatWidth,
    maxChatWidth,
    chatPanelWidth,
    clampedChatPanelWidth,
    openChatPanel,
    closeChatPanel,
    setChatPanelWidth,
  }
})
