<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
      <div class="bg-morandi-paper w-full max-w-md shadow-2xl p-8 animate-in fade-in zoom-in duration-300 border border-morandi-border rounded-none flex flex-col max-h-[85vh]">
        <!-- 头部标题 -->
        <h3 class="font-serif text-xl text-morandi-text mb-1">选择导出模块</h3>
        <p class="text-[9.5px] uppercase tracking-[0.3em] text-morandi-muted mb-6">
          SELECT CONTENT TO EXPORT
        </p>

        <!-- 模块列表容器 -->
        <div class="flex-1 overflow-y-auto scroll-thin mb-6 pr-2">
          <!-- 全选与反选控制栏 -->
          <div class="flex items-center justify-between mb-4 pb-2 border-b border-morandi-border/30">
            <span class="text-[11px] text-morandi-muted font-serif">已选择 {{ selectedIds.length }} 个模块</span>
            <div class="flex items-center space-x-2 text-[10px] text-morandi-muted">
              <span @click="selectAll" class="cursor-pointer hover:text-morandi-text transition-colors">全选</span>
              <span>·</span>
              <span @click="selectNone" class="cursor-pointer hover:text-morandi-text transition-colors">取消全选</span>
            </div>
          </div>

          <!-- 模块列表 -->
          <div class="space-y-2">
            <div 
              v-for="module in modules" 
              :key="module.id"
              @click="toggleSelect(module.id)"
              class="flex items-center justify-between p-3 border border-morandi-border/30 hover:border-morandi-text/20 hover:bg-morandi-text/5 cursor-pointer transition-all duration-200 group rounded-[2px]"
            >
              <div class="flex items-center space-x-3">
                <!-- 高奢圆形硬件微型复选框 -->
                <div 
                  class="w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 select-none"
                  :class="[
                    isSelected(module.id) 
                      ? 'bg-morandi-text border-morandi-text scale-105 shadow-sm' 
                      : 'border-morandi-text/20 bg-morandi-paper group-hover:border-morandi-text/40'
                  ]"
                >
                  <svg 
                    v-if="isSelected(module.id)" 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="h-3 w-3 text-morandi-canvas" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                
                <span 
                  class="text-xs font-serif transition-colors duration-200"
                  :class="isSelected(module.id) ? 'text-morandi-text' : 'text-morandi-muted'"
                >
                  {{ module.title || getModuleTypeName(module.type) }}
                </span>
              </div>

              <!-- 优雅的裸排打字机模块类型标头 -->
              <span class="text-[9px] uppercase tracking-wider text-morandi-muted bg-morandi-canvas px-2 py-0.5 rounded-[2px] group-hover:bg-morandi-canvas/60">
                {{ getModuleTypeName(module.type) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 底部快门操作按钮 -->
        <div class="flex justify-end gap-3 pt-4 border-t border-morandi-border/30">
          <button 
            @click="handleCancel" 
            class="px-6 py-2 text-[11px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors font-medium outline-none"
          >
            取消
          </button>
          <button 
            @click="handleConfirm" 
            :disabled="selectedIds.length === 0"
            class="px-6 py-2 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity font-medium outline-none shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            确认导出
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  modules: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:show', 'confirm', 'cancel'])

const selectedIds = ref([])

// 打开弹窗时，默认全选策划案内的所有模块
watch(() => props.show, (newVal) => {
  if (newVal) {
    selectedIds.value = props.modules.map(m => m.id)
  }
})

const isSelected = (id) => selectedIds.value.includes(id)

const toggleSelect = (id) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const selectAll = () => {
  selectedIds.value = props.modules.map(m => m.id)
}

const selectNone = () => {
  selectedIds.value = []
}

// 模块类型名汉化映射
const getModuleTypeName = (type) => {
  const typeMap = {
    theme: '拍摄主题',
    model: '拍摄模特',
    location: '拍摄场地',
    makeup: '拍摄妆容',
    clothing: '模特服装',
    props: '拍摄道具',
    reference: '参考样片',
    shoot_time: '拍摄日期',
    custom: '自定义模块'
  }
  return typeMap[type] || '通用模块'
}

const handleConfirm = () => {
  emit('confirm', [...selectedIds.value])
  emit('update:show', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:show', false)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
