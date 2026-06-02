<template>
  <div class="h-full bg-morandi-canvas overflow-y-auto px-12 py-16 scroll-smooth" id="canvas-container">
    <div id="export-canvas" class="max-w-4xl mx-auto bg-morandi-paper shadow-[0_10px_35px_rgba(0,0,0,0.015),0_30px_90px_rgba(0,0,0,0.035)] min-h-full p-16 rounded-none">
      
      <!-- 动态渲染所有模块 -->
      <div 
        v-for="module in renderedModules" 
        :key="module.id"
        :id="'module-' + module.id"
        class="group transition-all duration-500 py-16 pl-6 border-l-2 border-transparent border-t border-morandi-border/30 first:border-t-0 first:pt-0"
        :class="[ 
          (isEditing && store.activeModuleId === module.id) ? 'border-l-morandi-red bg-morandi-canvas/10' : '',
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
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
})
</script>
