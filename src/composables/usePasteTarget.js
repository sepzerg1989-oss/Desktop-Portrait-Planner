import { ref, onMounted, onUnmounted } from 'vue'

const activeTarget = ref(null)
let globalListenerInstalled = false

function installGlobalPasteListener() {
  if (globalListenerInstalled) return
  globalListenerInstalled = true

  window.addEventListener('paste', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    const items = e.clipboardData?.items
    if (!items) return
    const hasImage = Array.from(items).some(item => item.type.startsWith('image/'))
    if (!hasImage) return

    if (activeTarget.value && activeTarget.value.handler) {
      e.preventDefault()
      activeTarget.value.handler(e)
    }
  })
}

export function usePasteTarget() {
  const targetId = Symbol('paste-target')

  const activate = (handler) => {
    activeTarget.value = { id: targetId, handler }
  }

  const deactivate = () => {
    if (activeTarget.value?.id === targetId) {
      activeTarget.value = null
    }
  }

  onMounted(() => {
    installGlobalPasteListener()
  })

  onUnmounted(() => {
    deactivate()
  })

  return { activate, deactivate, isPasteActive: () => activeTarget.value?.id === targetId }
}
