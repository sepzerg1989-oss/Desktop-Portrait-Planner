import { ref } from 'vue'

export function useCanvasDrag(triggerAutoSave) {
  const draggedInfo = ref(null)
  const draggingIdx = ref(null)
  const draggedModuleId = ref(null)

  const onDragStart = (e, module, index) => {
    draggedInfo.value = { module, index }
    draggingIdx.value = index
    draggedModuleId.value = module.id
    e.dataTransfer.effectAllowed = 'move'
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', index)
    }
  }

  const onDragOver = (e, index) => {
    if (!draggedInfo.value) return
    
    const { module: sourceModule, index: sourceIndex } = draggedInfo.value
    if (sourceIndex === index) return

    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX
    const mouseY = e.clientY
    
    const midX = rect.left + rect.width / 2
    const midY = rect.top + rect.height / 2
    
    // 移除对宽高的除法权重，直接使用绝对位移判断移动方向
    const isHorizontalMove = Math.abs(mouseX - midX) > Math.abs(mouseY - midY)
    
    if (isHorizontalMove) {
      if (sourceIndex > index && mouseX > midX) return
      if (sourceIndex < index && mouseX < midX) return
    } else {
      if (sourceIndex > index && mouseY > midY) return
      if (sourceIndex < index && mouseY < midY) return
    }
    
    const images = [...sourceModule.data.images]
    const [removed] = images.splice(sourceIndex, 1)
    images.splice(index, 0, removed)
    
    sourceModule.data.images = images
    draggedInfo.value.index = index
    draggingIdx.value = index
  }

  const onDrop = (e, targetModule, targetIndex) => {
    if (!draggedInfo.value) return
    draggedInfo.value = null
    draggingIdx.value = null
    draggedModuleId.value = null
    triggerAutoSave()
  }

  const onDragEnd = () => {
    if (draggedInfo.value) {
      draggedInfo.value = null
      draggingIdx.value = null
      draggedModuleId.value = null
      triggerAutoSave()
    }
  }

  return {
    draggingIdx,
    draggedModuleId,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd
  }
}
