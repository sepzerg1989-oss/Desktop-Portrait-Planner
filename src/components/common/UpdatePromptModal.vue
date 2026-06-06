<template>
  <transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- 遮罩 -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleBackgroundClick"></div>
      
      <!-- 弹窗主体 (高奢直角卡纸与复合深阴影) -->
      <div class="relative bg-morandi-paper shadow-2xl border border-morandi-border w-full max-w-md p-8 animate-in zoom-in-95 duration-200 rounded-none">
        <!-- 标题区域 -->
        <h3 class="font-serif text-xl text-morandi-text mb-2">发现新版本</h3>
        <p class="text-[10px] uppercase tracking-widest text-morandi-muted mb-6">
          New Version Available · v{{ updateInfo.version }}
        </p>

        <div v-if="!isDownloading">
          <!-- 更新内容日志 (凹陷装裱卡槽) -->
          <p class="text-[10px] uppercase tracking-widest text-morandi-muted mb-2 font-medium">更新内容 / Changelog：</p>
          <div class="max-h-36 overflow-y-auto mb-4 bg-morandi-canvas/10 p-4 border border-morandi-border text-xs text-morandi-text leading-relaxed whitespace-pre-line font-sans scroll-thin shadow-[inset_0_2px_8px_rgba(0,0,0,0.01)]">
            {{ updateInfo.changelog }}
          </div>

          <!-- 备用下载通道 (百度网盘) -->
          <div class="mb-6 bg-morandi-canvas/5 p-3 border border-dashed border-morandi-border text-[11px] text-morandi-text leading-relaxed select-text">
            <span class="text-[9px] uppercase tracking-widest text-morandi-muted block mb-1 font-semibold">备用网盘下载 / Backup Link：</span>
            <p class="text-morandi-muted text-[10px] mb-1.5 leading-snug">
              本项目使用 GitHub 镜像站自动更新，若遇到网络问题无法下载更新包，可手动复制以下网盘地址前往浏览器下载最新的版本：
            </p>
            <div class="bg-morandi-canvas/10 p-2 border border-morandi-border font-mono select-text break-all text-[10px]">
              链接：https://pan.baidu.com/s/1jDNYUUlCc4eWCK0vygJyyw?pwd=5acq<br/>
              提取码：5acq
            </div>
          </div>

          <!-- 操作按钮 (一Ghost一快门胶囊) -->
          <div class="flex justify-end gap-3">
            <button 
              @click="ignoreUpdate" 
              class="px-6 py-2 text-[11px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors font-medium outline-none"
            >
              忽略此版本 Ignore
            </button>
            <button 
              @click="startUpdate" 
              class="px-6 py-2 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity font-medium outline-none shadow-sm"
            >
              立即更新 Update
            </button>
          </div>
        </div>

        <!-- 下载进度条 (精密仪器线槽) -->
        <div v-else class="py-2">
          <div class="flex justify-between items-center text-xs text-morandi-text mb-3">
            <span class="text-[10px] uppercase tracking-widest text-morandi-muted font-medium">{{ progressText }}</span>
            <span class="text-xs font-serif font-bold text-morandi-text">{{ progress }}%</span>
          </div>
          <div class="w-full h-1.5 bg-morandi-canvas/20 overflow-hidden border border-morandi-border shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
            <div 
              class="h-full bg-morandi-text transition-all duration-150 ease-out" 
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
          <p v-if="downloadError" class="text-xs text-morandi-red mt-3 font-medium">
            下载失败：{{ downloadError }}
          </p>
          <p v-else class="text-[10px] uppercase tracking-wider text-morandi-muted mt-3 font-sans leading-relaxed">
            更新包下载完成后，将自动为您执行安装升级。
          </p>
          
          <div class="flex justify-end mt-6">
            <button 
              @click="cancelDownload" 
              class="px-6 py-2 border border-morandi-text text-morandi-text hover:bg-morandi-text hover:text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full transition-all outline-none font-medium"
            >
              {{ downloadError ? '关闭 / Close' : '取消下载 / Cancel' }}
            </button>
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
    if (err.message !== 'USER_CANCELLED') {
      isDownloading.value = true
      downloadError.value = err.message
    } else {
      isDownloading.value = false
      progress.value = 0
    }
  }
}

const cancelDownload = async () => {
  if (downloadError.value) {
    isOpen.value = false
    isDownloading.value = false
    progress.value = 0
    downloadError.value = null
    return
  }

  try {
    if (window.electronAPI && window.electronAPI.cancelDownload) {
      await window.electronAPI.cancelDownload()
    }
  } catch (err) {
    console.error('取消下载失败:', err)
  }
  
  isDownloading.value = false
  progress.value = 0
  downloadError.value = null
  isOpen.value = false
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
