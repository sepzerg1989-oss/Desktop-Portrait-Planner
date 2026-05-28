<template>
  <div class="space-y-6">
    <div class="border-b border-black/5 pb-4">
      <h2 class="text-sm font-bold text-morandi-text">导入导出</h2>
      <p class="text-xs text-morandi-muted leading-relaxed font-sans mt-2">
        将软件内的策划方案、模特库或场地库数据打包导出以便备份或与他人共享，或者导入别人分享给你的数据包。
      </p>
    </div>

    <!-- 导出卡片 -->
    <div class="bg-morandi-panel p-5 border border-black/5 flex items-center justify-between">
      <div class="space-y-1">
        <h3 class="text-xs font-bold text-morandi-text">备份与导出数据</h3>
        <p class="text-[11px] text-morandi-muted font-sans">选择并打包你的策划案、模特或场地数据，生成备份数据包。</p>
      </div>
      <button 
        @click="showExportModal = true" 
        class="shrink-0 px-5 py-2 bg-morandi-text text-white text-xs hover:bg-black transition-all"
      >
        选择并导出
      </button>
    </div>

    <!-- 导入区（拖拽上传 + 点击浏览二合一） -->
    <div class="space-y-3">
      <h3 class="text-xs font-bold text-morandi-text">数据包导入</h3>
      
      <div 
        @dragenter.prevent="onDragEnter"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
        @click="triggerFileSelect"
        :class="[
          'relative min-h-[110px] border border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-200 select-none group',
          isDragActive ? 'border-morandi-text bg-morandi-panel/40 scale-[1.005]' : 'border-black/10 bg-transparent hover:border-morandi-text',
          isInvalidFile ? 'border-red-400 bg-red-50/40 animate-shake' : '',
          isImporting ? 'pointer-events-none opacity-80' : ''
        ]"
      >
        <!-- 正常/拖入悬停状态 -->
        <div v-if="!isImporting && !importSuccess" class="space-y-1 py-3">
          <p v-if="isDragActive" class="text-xs text-morandi-text font-bold">释放以导入数据包</p>
          <p v-else-if="isInvalidFile" class="text-xs text-red-500 font-bold">{{ errorMessage }}</p>
          <p v-else class="text-xs text-morandi-text font-sans">
            将 <span class="underline font-bold text-morandi-text">.ppexport 备份文件</span> 拖拽至此处，或 <span class="text-morandi-text font-bold">点击选择文件导入</span>
          </p>
          <p class="text-[9px] text-morandi-muted font-sans tracking-wide mt-1">系统将自动合并数据与图片，不覆盖已有内容</p>
        </div>

        <!-- 导入中状态 -->
        <div v-if="isImporting" class="space-y-4 flex flex-col items-center">
          <div class="relative flex items-center justify-center">
            <svg class="animate-spin h-10 w-10 text-morandi-text" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-morandi-text font-bold tracking-wider animate-pulse">正在解析并导入数据，请稍候...</p>
            <p class="text-[10px] text-morandi-muted font-sans">这可能需要几秒钟，系统正在提取图片与合并库数据</p>
          </div>
        </div>

        <!-- 导入成功状态 -->
        <div v-if="importSuccess" class="space-y-3 flex flex-col items-center animate-scale-in">
          <div class="w-12 h-12 text-green-600 flex items-center justify-center">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-green-600 font-bold tracking-wider">数据包导入成功！</p>
            <p class="text-[10px] text-morandi-muted font-sans">策划案、模特库与场地库已成功加载，界面已刷新</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据导出弹窗 -->
    <DataExchangeModal v-model:isOpen="showExportModal" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePlanStore } from '../../store/planStore'
import { useModelStore } from '../../store/modelStore'
import { useLocationStore } from '../../store/locationStore'
import DataExchangeModal from '../common/DataExchangeModal.vue'

const planStore = usePlanStore()
const modelStore = useModelStore()
const locationStore = useLocationStore()

const showExportModal = ref(false)
const isImporting = ref(false)
const importSuccess = ref(false)
const isDragActive = ref(false)
const isInvalidFile = ref(false)
const errorMessage = ref('')
const dragCounter = ref(0)
const shakeTimer = ref(null)

const onDragEnter = (e) => {
  e.preventDefault()
  dragCounter.value++
  if (dragCounter.value > 0) {
    isDragActive.value = true
  }
}

const onDragOver = (e) => {
  e.preventDefault()
}

const onDragLeave = (e) => {
  e.preventDefault()
  dragCounter.value--
  if (dragCounter.value === 0) {
    isDragActive.value = false
  }
}

const onDrop = async (e) => {
  e.preventDefault()
  isDragActive.value = false
  dragCounter.value = 0
  isInvalidFile.value = false

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  if (files.length > 1) {
    triggerError('一次只能拖拽并导入一个数据包')
    return
  }

  const file = files[0]
  if (!file.name.endsWith('.ppexport')) {
    triggerError('仅支持 .ppexport 格式的备份数据包')
    return
  }

  try {
    const path = window.electronAPI.getFilePath(file)
    if (path) {
      await executeImport(path)
    } else {
      triggerError('获取文件路径失败')
    }
  } catch (err) {
    triggerError('读取文件异常: ' + err.message)
  }
}

const triggerError = (msg) => {
  errorMessage.value = msg
  isInvalidFile.value = true
  
  if (shakeTimer.value) clearTimeout(shakeTimer.value)
  shakeTimer.value = setTimeout(() => {
    isInvalidFile.value = false
  }, 3000)
}

const triggerFileSelect = async (e) => {
  // 阻止在子按钮或导入中状态下的点击扩散
  if (isImporting.value || importSuccess.value) return
  // 如果是点击了按钮，则不需要处理
  if (e.target.closest('button')) return

  // 点击背景直接调用传统的系统文件浏览器选择导入
  await executeImport()
}

const executeImport = async (filePath = null) => {
  if (isImporting.value) return
  isImporting.value = true
  isInvalidFile.value = false

  try {
    const res = await window.electronAPI.importData(filePath)
    if (res.success) {
      importSuccess.value = true
      // 刷新全局 Pinia 仓库
      await Promise.all([
        planStore.fetchPlans(),
        modelStore.fetchAll(),
        locationStore.fetchAll(),
      ])
      setTimeout(() => {
        importSuccess.value = false
      }, 3000)
    } else if (res.error !== 'User canceled') {
      triggerError('导入失败: ' + res.error)
    }
  } catch (err) {
    triggerError('导入过程出现异常: ' + err.message)
  } finally {
    isImporting.value = false
  }
}
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-scale-in {
  animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
