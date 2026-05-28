<template>
  <transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- 遮罩 -->
      <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" @click="handleBackgroundClick"></div>
      
      <!-- 弹窗主体 -->
      <div class="relative bg-white shadow-2xl border border-black/5 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="p-8">
          <!-- 标题 -->
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-2.5 h-6 bg-morandi-green"></div>
            <h3 class="font-serif text-xl text-morandi-text">发现新版本</h3>
            <span class="px-2 py-0.5 text-[10px] tracking-wider bg-morandi-green/20 text-morandi-text border border-morandi-green/30">v{{ updateInfo.version }}</span>
          </div>

          <div v-if="!isDownloading">
            <!-- 更新内容日志 -->
            <p class="text-xs text-morandi-muted mb-2 font-medium">更新内容：</p>
            <div class="max-h-48 overflow-y-auto mb-6 bg-morandi-panel/60 p-4 border border-black/5 text-xs text-morandi-text leading-relaxed whitespace-pre-line font-sans">
              {{ updateInfo.changelog }}
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-end space-x-4">
              <button 
                @click="ignoreUpdate" 
                class="px-5 py-2 text-xs tracking-wider text-morandi-muted hover:text-morandi-text transition-colors"
              >
                忽略此版本
              </button>
              <button 
                @click="startUpdate" 
                class="px-6 py-2 text-xs tracking-wider bg-morandi-text text-white hover:bg-black/80 transition-colors shadow shadow-black/5 font-medium"
              >
                立即更新
              </button>
            </div>
          </div>

          <!-- 下载进度条 -->
          <div v-else class="py-4">
            <div class="flex justify-between items-center text-xs text-morandi-text mb-2">
              <span class="font-medium">{{ progressText }}</span>
              <span class="font-bold text-morandi-green">{{ progress }}%</span>
            </div>
            <div class="w-full h-2 bg-morandi-panel overflow-hidden border border-black/5">
              <div 
                class="h-full bg-morandi-green transition-all duration-150 ease-out" 
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
            <p v-if="downloadError" class="text-xs text-red-500 mt-2 font-medium">
              下载失败：{{ downloadError }}
            </p>
            <p v-else class="text-xs text-morandi-muted mt-2 font-sans">
              更新包下载完成后，将自动为您执行安装升级。
            </p>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const isOpen = ref(false)
const isDownloading = ref(false)
const progress = ref(0)
const downloadError = ref(null)
const updateInfo = ref({
  version: '',
  changelog: '',
  downloadUrl: ''
})

let cleanupProgress = null
let cleanupAvailable = null

const progressText = computed(() => {
  if (downloadError.value) return '下载出错'
  if (progress.value === 100) return '正在准备安装...'
  return '正在下载更新包...'
})

const handleBackgroundClick = () => {
  // 下载中禁止通过点击遮罩关闭弹窗，确保更新过程不被打断
  if (!isDownloading.value) {
    isOpen.value = false
  }
}

const ignoreUpdate = async () => {
  try {
    if (window.electronAPI && window.electronAPI.ignoreVersion) {
      await window.electronAPI.ignoreVersion(updateInfo.value.version)
    }
  } catch (err) {
    console.error('忽略版本失败:', err)
  }
  isOpen.value = false
}

const startUpdate = async () => {
  isDownloading.value = true
  progress.value = 0
  downloadError.value = null
  
  try {
    if (window.electronAPI && window.electronAPI.startDownload) {
      const res = await window.electronAPI.startDownload(updateInfo.value.downloadUrl)
      if (res && !res.success) {
        throw new Error(res.error || '下载失败')
      }
    } else {
      throw new Error('未检测到更新接口')
    }
  } catch (err) {
    isDownloading.value = false
    downloadError.value = err.message
  }
}

onMounted(() => {
  if (window.electronAPI) {
    // 监听自动检测到的更新
    if (window.electronAPI.onUpdateAvailable) {
      cleanupAvailable = window.electronAPI.onUpdateAvailable((data) => {
        if (data && data.version) {
          updateInfo.value = data
          isOpen.value = true
        }
      })
    }

    // 监听下载进度更新
    if (window.electronAPI.onDownloadProgress) {
      cleanupProgress = window.electronAPI.onDownloadProgress((val) => {
        progress.value = val
      })
    }
  }
})

onUnmounted(() => {
  if (cleanupAvailable) cleanupAvailable()
  if (cleanupProgress) cleanupProgress()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
