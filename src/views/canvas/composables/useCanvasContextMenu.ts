import { onMounted, onUnmounted, ref } from 'vue'

export interface HandleConnectFrom {
  nodeId: string
  handleType: 'source' | 'target'
}

export interface CanvasContextMenuState {
  x: number
  y: number
  connectFrom?: HandleConnectFrom
}
/** 画布右键菜单 */
export function useCanvasContextMenu() {
  const menu = ref<CanvasContextMenuState | null>(null)

  function openMenu(state: CanvasContextMenuState) {
    menu.value = state
  }

  function closeMenu() {
    menu.value = null
  }

  function onDocumentKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') closeMenu()
  }

  function onDocumentPointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement
    if (target.closest('.canvas-context-menu')) return
    closeMenu()
  }

  onMounted(() => {
    document.addEventListener('keydown', onDocumentKeyDown)
    document.addEventListener('pointerdown', onDocumentPointerDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', onDocumentKeyDown)
    document.removeEventListener('pointerdown', onDocumentPointerDown)
  })

  return { menu, openMenu, closeMenu }
}
