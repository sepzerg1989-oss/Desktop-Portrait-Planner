<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePlanStore } from '../store/planStore'
import { useModal } from '../composables/useModal'
import ModuleManager from '../components/PlanEditor/ModuleManager.vue'
import Canvas from '../components/PlanEditor/Canvas.vue'
import PropertyInspector from '../components/PlanEditor/PropertyInspector.vue'

const router = useRouter()
const route = useRoute()
const store = usePlanStore()
const isEditing = ref(false)
const canvasRef = ref(null)

// -------------------- 自动保存逻辑 --------------------
function debounce(fn, delay) {
  let timer = null
  return {
    call: (...args) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => fn(...args), delay)
    },
    cancel: () => {
      if (timer) clearTimeout(timer)
      timer = null
    }
  }
}

const autoSave = debounce(() => {
  if (isEditing.value && store.planId) {
    store.savePlan()
  }
}, 2000)

watch(
  () => [JSON.stringify(store.modules), store.planTitle],
  (newVal, oldVal) => {
    if (isEditing.value && newVal[0] !== oldVal?.[0]) {
      autoSave.call()
    }
  }
)
// ------------------------------------------------------

// 弹窗状态管理（复用 composable）
const { modal, showModal, closeModal, handleModalConfirm } = useModal()

// 如果没有加载策划案，跳回大厅；如果是新建模式，自动进入编辑状态
onMounted(() => {
  if (!store.planId) {
    router.push('/')
    return
  }

  store.setActiveModule(null) // 每次进入初始化清除选中状态

  if (route.query.mode === 'edit') {
    isEditing.value = true
  }
})

const toggleEdit = () => {
  isEditing.value = !isEditing.value
}

/** 完成编辑 — 自动保存到 SQLite */
const finishEditing = async () => {
  autoSave.cancel()
  await store.savePlan()
  store.setActiveModule(null) // 完成编辑后重置选中状态
  isEditing.value = false
}

/** 保存为模板 */
const handleSaveTemplate = () => {
  showModal({
    title: '另存为模板',
    message: '请输入模板名称，方便下次直接使用：',
    type: 'prompt',
    inputValue: '我的常用策划模板',
    onConfirm: async (name) => {
      if (name) {
        await store.saveAsTemplate(name)
        showModal({
          title: '保存成功',
          message: '模板已存入素材库，下次新建策划时可直接选择。',
          type: 'alert'
        })
      }
    }
  })
}

/** 删除当前策划案 */
const handleDelete = () => {
  showModal({
    title: '确认删除',
    message: '确定要删除该策划案吗？此操作不可撤销。',
    type: 'confirm',
    onConfirm: async () => {
      await store.deletePlan(store.planId)
      router.push('/')
    }
  })
}

/** 导出长图 */
const handleExportJPG = async () => {
  if (!canvasRef.value) return
  
  showModal({ title: '正在导出', message: '正在生成高清长图，请稍候...', type: 'alert' })
  
  const dataUrl = await canvasRef.value.exportToImage()
  if (!dataUrl) {
    showModal({ title: '导出失败', message: '未能生成长图，请重试。', type: 'alert' })
    return
  }

  const res = await window.electronAPI.exportImage(dataUrl, `${store.planTitle || '未命名策划案'}_长图.jpg`)
  
  if (res.success) {
    showModal({ title: '导出成功', message: `长图已保存至：\n${res.filePath}`, type: 'alert' })
  } else if (res.error !== 'User canceled') {
    showModal({ title: '导出失败', message: res.error, type: 'alert' })
  } else {
    closeModal()
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-morandi-canvas overflow-hidden select-none">
    <!-- 顶部工具栏 -->
    <header class="h-16 bg-morandi-canvas border-b border-black/5 flex items-center justify-between px-8 z-30 shrink-0">
      <div class="flex items-center space-x-6">
        <button @click="router.push('/')" class="text-morandi-muted hover:text-morandi-text transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        <div class="h-4 w-px bg-black/10"></div>
        <h1 class="font-serif text-lg text-morandi-text">{{ store.planTitle || '未命名策划案' }}</h1>
      </div>

      <div class="flex items-center space-x-4">
        <button 
          v-if="!isEditing"
          @click="toggleEdit" 
          class="px-8 py-2 bg-morandi-text text-white text-xs uppercase tracking-widest hover:bg-black transition-all"
        >
          编辑
        </button>
        <button 
          v-else
          @click="finishEditing" 
          class="px-8 py-2 bg-morandi-blue text-white text-xs uppercase tracking-widest hover:bg-opacity-90 transition-all"
        >
          完成编辑
        </button>
        
        <div class="flex space-x-2 border-l border-black/10 pl-4">
          <button @click="handleExportJPG" class="p-2 text-morandi-muted hover:text-morandi-blue transition-colors" title="导出长图">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          <button @click="handleDelete" class="p-2 text-morandi-muted hover:text-red-400 transition-colors" title="删除策划">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 flex overflow-hidden">
      <!-- 左侧模块管理 (侧边栏平滑推拉) -->
      <aside 
        class="bg-white border-r border-black/5 overflow-hidden transition-all duration-500 ease-in-out"
        :class="isEditing ? 'w-64 opacity-100' : 'w-0 opacity-0 border-none'"
      >
        <div class="w-64 h-full"> <!-- 增加 h-full 确保内容可滚动 -->
          <ModuleManager @save-template="handleSaveTemplate" />
        </div>
      </aside>

      <!-- 中间主画布 (自动响应两侧宽度变化) -->
      <section class="flex-1 relative overflow-hidden">
        <Canvas ref="canvasRef" :is-editing="isEditing" />
      </section>

      <!-- 右侧属性检查器 (侧边栏平滑推拉) -->
      <aside 
        class="bg-white border-l border-black/5 overflow-hidden transition-all duration-500 ease-in-out"
        :class="isEditing ? 'w-80 opacity-100' : 'w-0 opacity-0 border-none'"
      >
        <div class="w-80 h-full"> <!-- 增加 h-full -->
          <PropertyInspector @notify="showModal" />
        </div>
      </aside>
    </main>

    <!-- 自定义精美弹窗 (Morandi Style Modal) -->
    <transition name="fade">
      <div v-if="modal.show" class="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
          <div class="p-8">
            <h3 class="font-serif text-xl text-morandi-text mb-2">{{ modal.title }}</h3>
            <p class="text-sm text-morandi-muted mb-6 leading-relaxed">{{ modal.message }}</p>
            
            <!-- Prompt 输入框 -->
            <div v-if="modal.type === 'prompt'" class="mb-8">
              <input 
                v-model="modal.inputValue" 
                type="text" 
                class="w-full px-4 py-3 border border-black/5 bg-morandi-canvas/30 outline-none focus:border-morandi-blue text-sm"
                autofocus
                @keyup.enter="handleModalConfirm"
              />
            </div>

            <div class="flex justify-end space-x-4">
              <button 
                v-if="modal.type !== 'alert'"
                @click="closeModal" 
                class="px-6 py-2.5 text-xs uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors"
              >
                取消
              </button>
              <button 
                @click="handleModalConfirm" 
                class="px-8 py-2.5 bg-morandi-text text-white text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg"
              >
                {{ modal.type === 'confirm' ? '确定删除' : '确定' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
