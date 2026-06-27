<template>
  <div class="h-full bg-morandi-canvas overflow-y-auto px-8 py-10 scroll-smooth" id="canvas-container">
    <div id="export-canvas" class="max-w-4xl mx-auto bg-morandi-paper shadow-[0_10px_35px_rgba(0,0,0,0.015),0_30px_90px_rgba(0,0,0,0.035)] min-h-full p-8 rounded-none">
      
      <!-- 动态渲染所有模块 -->
      <div 
        v-for="module in renderedModules" 
        :key="module.id"
        :id="'module-' + module.id"
        class="group relative transition-all duration-500 py-16 border-t border-morandi-border/30 first:border-t-0 first:pt-0"
        :class="[ 
          (isEditing && store.activeModuleId === module.id) ? 'active-module-marker bg-morandi-canvas/10' : '',
          isEditing ? 'cursor-pointer' : ''
        ]"
        @click="isEditing && store.setActiveModule(module.id)"
      >
        <ThemeModule 
          v-if="module.type === 'theme'"
          :module="module" :is-editing="isEditing" :dragging-idx="draggingIdx" :dragged-module-id="draggedModuleId"
          @dragstart="onDragStart" @dragover="onDragOver" @drop="onDrop" @dragend="onDragEnd" @remove-image="removeImage"
        />

        <ModelModule 
          v-else-if="module.type === 'model'"
          :module="module" :is-editing="isEditing" :dragging-idx="draggingIdx" :dragged-module-id="draggedModuleId"
          @dragstart="onDragStart" @dragover="onDragOver" @drop="onDrop" @dragend="onDragEnd" @remove-image="removeImage"
          @save="triggerAutoSave"
        />

        <LocationModule 
          v-else-if="module.type === 'location'"
          :module="module" :is-editing="isEditing" :dragging-idx="draggingIdx" :dragged-module-id="draggedModuleId"
          @dragstart="onDragStart" @dragover="onDragOver" @drop="onDrop" @dragend="onDragEnd" @remove-image="removeImage"
        />

        <ClothingModule 
          v-else-if="module.type === 'clothing'"
          :module="module" :is-editing="isEditing" :dragging-idx="draggingIdx" :dragged-module-id="draggedModuleId"
          @dragstart="onDragStart" @dragover="onDragOver" @drop="onDrop" @dragend="onDragEnd" @remove-image="removeImage"
        />

        <PropsModule 
          v-else-if="module.type === 'props'"
          :module="module" :is-editing="isEditing" :dragging-idx="draggingIdx" :dragged-module-id="draggedModuleId"
          @dragstart="onDragStart" @dragover="onDragOver" @drop="onDrop" @dragend="onDragEnd" @remove-image="removeImage"
        />

        <MakeupModule 
          v-else-if="module.type === 'makeup'"
          :module="module" :is-editing="isEditing" :dragging-idx="draggingIdx" :dragged-module-id="draggedModuleId"
          @dragstart="onDragStart" @dragover="onDragOver" @drop="onDrop" @dragend="onDragEnd" @remove-image="removeImage"
        />

        <TimeModule 
          v-else-if="module.type === 'shoot_time'"
          :module="module"
        />

        <GenericModule 
          v-else
          :module="module" :is-editing="isEditing" :dragging-idx="draggingIdx" :dragged-module-id="draggedModuleId"
          @dragstart="onDragStart" @dragover="onDragOver" @drop="onDrop" @dragend="onDragEnd" @remove-image="removeImage"
        />
      </div>
    </div>
    
    <!-- 简易高奢提示 Toast -->
    <Transition name="toast-fade">
      <div 
        v-if="toastMessage" 
        class="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] px-6 py-2 bg-morandi-text text-morandi-canvas text-xs tracking-widest font-sans shadow-2xl flex items-center gap-2 border border-morandi-border/30 backdrop-blur-md rounded-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-morandi-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePlanStore } from '../../store/planStore'
import html2canvas from 'html2canvas'

// 导入模块化组件
import ThemeModule from './CanvasModules/ThemeModule.vue'
import ModelModule from './CanvasModules/ModelModule.vue'
import LocationModule from './CanvasModules/LocationModule.vue'
import ClothingModule from './CanvasModules/ClothingModule.vue'
import PropsModule from './CanvasModules/PropsModule.vue'
import MakeupModule from './CanvasModules/MakeupModule.vue'
import TimeModule from './CanvasModules/TimeModule.vue'
import GenericModule from './CanvasModules/GenericModule.vue'

// 导入逻辑 Composable
import { useCanvasDrag } from '../../composables/useCanvasDrag'

const props = defineProps({
  isEditing: {
    type: Boolean,
    default: false
  }
})

const store = usePlanStore()

// 导出时临时过滤需要呈现的模块 ID 列表
const exportingModuleIds = ref(null)

const renderedModules = computed(() => {
  if (exportingModuleIds.value) {
    return store.modules.filter(m => exportingModuleIds.value.includes(m.id))
  }
  return store.modules
})

// 借用防抖触发保存机制
let saveTimeout = null
const triggerAutoSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    store.savePlan()
  }, 2000)
}

// 使用提取后的拖拽逻辑
const { draggingIdx, draggedModuleId, onDragStart, onDragOver, onDrop, onDragEnd } = useCanvasDrag(triggerAutoSave)

const removeImage = (module, index) => {
  if (!props.isEditing) return
  if (index && typeof index === 'object') {
    const { itemIndex, imgIndex } = index
    if (module.data.items && module.data.items[itemIndex]) {
      const item = module.data.items[itemIndex]
      const imagesCount = item.images ? item.images.length : 0
      
      if (imagesCount <= 1) {
        // 如果是最后一张图片或无图片占位，直接删除整个服装/道具子素材项
        module.data.items.splice(itemIndex, 1)
      } else {
        // 否则只删除该子项下的特定图片
        item.images.splice(imgIndex, 1)
      }
    }
  } else {
    module.data.images.splice(index, 1)
  }
  triggerAutoSave()
}

// 监听活动模块变化，自动滚动
watch(() => store.activeModuleId, (newId) => {
  const el = document.getElementById('module-' + newId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})

/**
 * 导出画布为高清长图
 * @param {Array<string>} selectedModuleIds - 用户勾选导出的模块 ID 列表
 */
const exportToImage = async (selectedModuleIds) => {
  const element = document.getElementById('export-canvas')
  if (!element) return false

  try {
    const oldActiveId = store.activeModuleId
    store.setActiveModule(null)
    
    if (selectedModuleIds && Array.isArray(selectedModuleIds)) {
      exportingModuleIds.value = selectedModuleIds
    }
    
    // 给 DOM 重新过滤渲染留出足够的重绘时间
    await new Promise(resolve => setTimeout(resolve, 100))

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: null
    })

    // 恢复原来的所有模块渲染
    exportingModuleIds.value = null
    store.setActiveModule(oldActiveId)
    
    // 恢复原有的 DOM 结构
    await new Promise(resolve => setTimeout(resolve, 50))

    return canvas.toDataURL("image/jpeg", 0.9)
  } catch (error) {
    exportingModuleIds.value = null
    return null
  }
}

defineExpose({
  exportToImage
})

onBeforeUnmount(() => {
  if (saveTimeout) clearTimeout(saveTimeout)
  if (toastTimeout) clearTimeout(toastTimeout)
  
  const container = document.getElementById('canvas-container')
  if (container) {
    container.removeEventListener('mouseover', handleMouseOver)
  }
  window.removeEventListener('keydown', handleKeyDown)
})

// -------------------- 图片复制到剪贴板逻辑 --------------------
const hoveredImageUrl = ref('')
const toastMessage = ref('')
let toastTimeout = null

const showToast = (msg) => {
  toastMessage.value = msg
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    toastMessage.value = ''
  }, 2000)
}

const copyImage = async (url) => {
  try {
    const res = await window.electronAPI.clipboard.copyImage(url)
    if (res.success) {
      showToast('已成功复制图片至剪贴板')
    } else {
      console.error('复制图片失败:', res.error)
      showToast('复制图片失败')
    }
  } catch (err) {
    console.error('复制图片异常:', err)
    showToast('复制图片异常')
  }
}

const handleMouseOver = (e) => {
  const target = e.target
  const img = target.closest('img')
  if (img && document.getElementById('export-canvas')?.contains(img)) {
    if (img.src) {
      hoveredImageUrl.value = img.src
    }
  } else {
    hoveredImageUrl.value = ''
  }
}

const handleKeyDown = async (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
    return
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    if (hoveredImageUrl.value) {
      e.preventDefault()
      await copyImage(hoveredImageUrl.value)
    }
  }
}

onMounted(() => {
  const container = document.getElementById('canvas-container')
  if (container) {
    container.addEventListener('mouseover', handleMouseOver)
  }
  window.addEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* 让画布内的所有元素（包括子组件内的图片和容器）在悬浮和拖拽时都保持默认的箭头指针 */
#export-canvas, #export-canvas :deep(*) {
  cursor: default !important;
}

/* 按钮及其内容依然保持手型指针，以便于操作 */
#export-canvas :deep(button), #export-canvas :deep(button *) {
  cursor: pointer !important;
}

.active-module-marker::before {
  content: '';
  position: absolute;
  left: -14px;
  top: 4rem;
  bottom: 4rem;
  width: 2px;
  background: var(--color-primary-red);
  pointer-events: none;
}

/* Toast 淡入淡出动画 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 1rem);
}
</style>
