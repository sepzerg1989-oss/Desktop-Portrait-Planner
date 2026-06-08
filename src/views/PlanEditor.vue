<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePlanStore } from '../store/planStore'
import { useModal } from '../composables/useModal'
import ModuleManager from '../components/PlanEditor/ModuleManager.vue'
import Canvas from '../components/PlanEditor/Canvas.vue'
import PropertyInspector from '../components/PlanEditor/PropertyInspector.vue'
import MorandiModal from '../components/common/MorandiModal.vue'
import ExportModuleModal from '../components/PlanEditor/ExportModuleModal.vue'
import NamePromptModal from '../components/common/NamePromptModal.vue'

const router = useRouter()
const route = useRoute()
const store = usePlanStore()
const isEditing = ref(false)
const canvasRef = ref(null)
const showExportModal = ref(false)

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
  () => store.modules,
  (newVal, oldVal) => {
    if (isEditing.value && newVal !== oldVal) {
      autoSave.call()
    }
  },
  { deep: true }
)
// ------------------------------------------------------

onBeforeUnmount(() => {
  autoSave.cancel()
})

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

const showNamePrompt = ref(false)
const promptName = ref('')
const namePromptTitle = ref('')
const namePromptSubTitle = ref('')
let activeConfirmCallback = null

const openNamePrompt = (title, subtitle, callback) => {
  promptName.value = ''
  namePromptTitle.value = title
  namePromptSubTitle.value = subtitle
  activeConfirmCallback = callback
  showNamePrompt.value = true
}

const cancelNamePrompt = () => {
  showNamePrompt.value = false
}

const confirmNamePrompt = async () => {
  let name = promptName.value.trim()
  if (!name) {
    name = '未命名模板'
  }
  showNamePrompt.value = false
  if (activeConfirmCallback) {
    await activeConfirmCallback(name)
  }
}

/** 保存为模板 */
const handleSaveTemplate = () => {
  openNamePrompt('另存为模板', 'Save As Template', async (name) => {
    await store.saveAsTemplate(name)
    showModal({
      title: '保存成功',
      message: '模板已存入素材库，下次新建策划时可直接选择。',
      type: 'alert'
    })
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

/** 导出长图 - 触发模块选择弹窗 */
const handleExportJPG = () => {
  if (!canvasRef.value) return
  // 如果当前没有任何模块，直接提示无需选择
  if (store.modules.length === 0) {
    showModal({ title: '导出提示', message: '当前策划案中还没有任何模块，无法导出长图。', type: 'alert' })
    return
  }
  showExportModal.value = true
}

/** 执行实际的过滤与图片生成导出 */
const executeExport = async (selectedModuleIds) => {
  showExportModal.value = false
  
  showModal({ title: '正在导出', message: '正在生成高清长图，请稍候...', type: 'alert' })
  
  const dataUrl = await canvasRef.value.exportToImage(selectedModuleIds)
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
          class="rounded-full px-8 py-2 bg-morandi-text text-morandi-canvas text-xs uppercase tracking-widest hover:opacity-90 transition-all outline-none"
        >
          编辑
        </button>
        <button 
          v-else
          @click="finishEditing" 
          class="rounded-full px-8 py-2 bg-morandi-text text-morandi-canvas text-xs uppercase tracking-widest hover:opacity-90 transition-all outline-none"
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
        class="bg-morandi-panel border-r border-morandi-border overflow-hidden transition-all duration-500 ease-in-out"
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
        class="bg-morandi-panel border-l border-morandi-border overflow-hidden transition-all duration-500 ease-in-out"
        :class="isEditing ? 'w-80 opacity-100' : 'w-0 opacity-0 border-none'"
      >
        <div class="w-80 h-full"> <!-- 增加 h-full -->
          <PropertyInspector @notify="showModal" />
        </div>
      </aside>
    </main>

    <!-- 自定义精美弹窗 (Morandi Style Modal) -->
    <MorandiModal
      :show="modal.show"
      :title="modal.title"
      :message="modal.message"
      :type="modal.type"
      :sub-title="modal.type === 'confirm' ? 'Confirmation Required' : 'Action Required'"
      :on-confirm="handleModalConfirm"
      :on-cancel="closeModal"
      cancel-text="取消"
      :confirm-text="modal.type === 'confirm' ? '确定删除' : '确定'"
      @update:show="modal.show = $event"
    />

    <!-- 新建前命名弹窗 (已抽离为通用组件) -->
    <NamePromptModal
      v-model:show="showNamePrompt"
      v-model:value="promptName"
      :title="namePromptTitle"
      :sub-title="namePromptSubTitle"
      label="请输入模板名称"
      placeholder="未命名模板"
      @confirm="confirmNamePrompt"
      @cancel="cancelNamePrompt"
    />

    <!-- 选择导出模块弹窗 -->
    <ExportModuleModal
      v-model:show="showExportModal"
      :modules="store.modules"
      @confirm="executeExport"
    />
  </div>
</template>
