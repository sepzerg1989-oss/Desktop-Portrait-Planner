<template>
  <div class="h-full bg-white border-r border-black/5 flex flex-col">
    <!-- 顶部标题与添加按钮 (固定) -->
    <div class="p-6 border-b border-black/5 shrink-0">
      <div class="mb-8">
        <h2 class="font-serif text-xl text-morandi-text/90 tracking-[0.1em]">
          模块管理 <span class="text-[10px] font-sans text-morandi-muted uppercase tracking-[0.3em] ml-2 font-normal">/ MODULES</span>
        </h2>
      </div>
      
      <!-- 添加模块按钮 (移至顶部) -->
      <div class="relative">
        <!-- 点击外部收回的透明遮罩层 -->
        <div v-if="showAddMenu" class="fixed inset-0 z-10" @click="showAddMenu = false"></div>

        <transition name="fade-pop-down">
          <div v-if="showAddMenu" class="absolute top-full left-0 right-0 bg-white border border-black/5 shadow-2xl p-2 mt-2 space-y-1 z-20">
            <button 
              v-for="opt in addOptions" :key="opt.type"
              @click="addModule(opt.type)"
              class="w-full text-left px-3 py-2.5 text-xs hover:bg-morandi-canvas transition-colors flex items-center group"
            >
              <component :is="getIcon(opt.type)" class="h-4 w-4 mr-3 text-morandi-muted group-hover:text-morandi-blue" />
              {{ opt.label }}
            </button>
          </div>
        </transition>
        
        <div class="flex items-stretch">
          <!-- 主动作：添加 -->
          <button 
            @click="showAddMenu = !showAddMenu"
            class="flex-1 py-2.5 border border-morandi-text border-r-0 text-morandi-text text-[10px] uppercase tracking-[0.2em] hover:bg-morandi-text hover:text-white transition-all flex items-center justify-center z-20 relative"
            :class="{ 'bg-morandi-text text-white': showAddMenu }"
          >
            <span class="flex items-center">
              <span v-if="!showAddMenu" class="text-sm mr-2 leading-none">+</span>
              {{ showAddMenu ? '收起菜单 / CLOSE' : '添加模块 / ADD' }}
            </span>
          </button>

          <!-- 次动作：另存为模板 -->
          <button 
            @click="handleSaveTemplate"
            class="px-4 py-2.5 border border-morandi-text text-morandi-text hover:bg-morandi-text hover:text-white transition-all flex items-center justify-center group"
            title="将当前策划案存为模板"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 模块列表 (可滚动) -->
    <div class="flex-1 overflow-y-auto p-4 scroll-thin">
      <draggable 
        v-model="modules" 
        item-key="id"
        handle=".drag-handle"
        ghost-class="opacity-0"
        chosen-class="bg-morandi-canvas"
        drag-class="shadow-2xl"
        :animation="300"
      >
        <template #item="{ element }">
          <div 
            class="flex items-center p-3 mb-2 cursor-pointer border border-transparent transition-all group relative"
            :class="[ activeModuleId === element.id ? 'bg-morandi-canvas border-black/5' : 'hover:bg-black/5' ]"
            @click="setActive(element.id)"
          >
            <!-- 模块图标 (取代三条杠) -->
            <div class="drag-handle mr-4 text-morandi-muted cursor-grab transition-colors group-hover:text-morandi-blue">
              <component :is="getIcon(element.type)" class="h-5 w-5" />
            </div>
            
            <div class="flex-1 text-sm font-medium text-morandi-text">
              {{ element.title }}
            </div>

            <!-- 删除按钮 (仅在 Hover 时显示) -->
            <button 
              @click.stop="confirmDelete(element)"
              class="opacity-0 group-hover:opacity-100 p-1 text-morandi-muted hover:text-red-400 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            <!-- 选中的指示器 -->
            <div v-if="activeModuleId === element.id" class="absolute left-0 top-0 bottom-0 w-1 bg-morandi-blue"></div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- 自定义确认弹窗 -->
    <ConfirmModal 
      :is-open="isConfirmOpen"
      title="删除确认"
      :message="confirmMessage"
      @confirm="executeDelete"
      @cancel="isConfirmOpen = false"
    />
  </div>
</template>

<script setup>
import { computed, ref, h } from 'vue'
import draggable from 'vuedraggable'
import { usePlanStore } from '../../store/planStore'
import ConfirmModal from '../ConfirmModal.vue'

// 定义图标 (SVG 方案)
const Icons = {
  theme: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.5' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.856.12-1.685.344-2.468' })]),
  model: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.5' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' })]),
  location: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.5' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z' }), h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' })]),
  clothing: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.5' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9.53 3.311a.75.75 0 01.441.667c0 1.501-.433 2.892-1.176 4.066a7.469 7.469 0 0110.39 10.39 7.5 7.5 0 11-9.655-15.123z' })]),
  props: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.5' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-5.25v9' })]),
  reference: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.5' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' })]),
  custom: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.5' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10' })]),
  shoot_time: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.5' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' })])
}

const getIcon = (type) => Icons[type] || Icons.reference

const store = usePlanStore()
const emit = defineEmits(['save-template'])

const showAddMenu = ref(false)

// 弹窗状态
const isConfirmOpen = ref(false)
const confirmMessage = ref('')
const moduleToDelete = ref(null)

const addOptions = [
  { type: 'theme', label: '拍摄主题' },
  { type: 'model', label: '拍摄模特' },
  { type: 'location', label: '拍摄场地' },
  { type: 'clothing', label: '模特服装' },
  { type: 'props', label: '拍摄道具' },
  { type: 'reference', label: '参考样片' },
  { type: 'shoot_time', label: '拍摄日期' },
  { type: 'custom', label: '自定义模块' }
]

const addModule = (type) => {
  store.addModule(type)
  showAddMenu.value = false
}

const confirmDelete = (module) => {
  moduleToDelete.value = module
  confirmMessage.value = `确定要删除模块 "${module.title}" 吗？此操作不可撤销。`
  isConfirmOpen.value = true
}

const executeDelete = () => {
  if (moduleToDelete.value) {
    store.removeModule(moduleToDelete.value.id)
    isConfirmOpen.value = false
    moduleToDelete.value = null
  }
}

/** 保存为模板 — 通知父组件处理 */
const handleSaveTemplate = () => {
  emit('save-template')
}

const modules = computed({
  get: () => store.modules,
  set: (val) => store.updateModules(val)
})

const activeModuleId = computed(() => store.activeModuleId)

const setActive = (id) => {
  store.setActiveModule(id)
}
</script>

<style scoped>
.fade-pop-down-enter-active, .fade-pop-down-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-pop-down-enter-from, .fade-pop-down-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
