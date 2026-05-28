<template>
  <div class="space-y-6">
    <div class="border-b border-black/5 pb-4">
      <h2 class="text-sm font-bold text-morandi-text">软件更新</h2>
      <p class="text-xs text-morandi-muted leading-relaxed mt-2 font-sans">
        检查当前软件版本并获取最新功能与优化。国内环境下自动启用高速镜像升级通道。
      </p>
    </div>

    <!-- 核心更新检测区 -->
    <div class="bg-morandi-panel p-6 border border-black/5 flex flex-col justify-between group space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-[10px] text-morandi-muted uppercase tracking-widest mb-1 font-sans">当前版本</div>
          <div class="text-xs text-morandi-text font-mono bg-white/80 border border-black/5 px-3 py-1.5 inline-block">
            v{{ currentVersion }}
          </div>
        </div>
        <button 
          @click="handleCheckUpdate"
          :disabled="isChecking || isDownloading"
          class="shrink-0 px-6 py-2.5 bg-morandi-text text-white text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <svg v-if="isChecking" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isChecking ? '正在检查...' : '检查更新' }}</span>
        </button>
      </div>

      <!-- 提示语：已经是最新版本 -->
      <div v-if="showLatestMsg" class="bg-transparent text-green-700 text-[10px] p-4 border border-green-600/30 animate-fade-in flex items-center font-sans">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        当前已是最新版本，无需更新。
      </div>

      <!-- 提示语：检查失败 -->
      <div v-if="checkError" class="bg-transparent text-red-700 text-[10px] p-4 border border-red-600/30 animate-fade-in flex items-center font-sans">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        检查更新失败：{{ checkError }}
      </div>
    </div>

    <!-- 发现新版本详情面板 -->
    <div v-if="hasUpdate && !isDownloading" class="bg-white p-6 border border-black/5 space-y-4 animate-fade-in">
      <div class="flex items-center space-x-2">
        <span class="w-2 h-2 rounded-full bg-morandi-green"></span>
        <h3 class="text-xs font-bold text-morandi-text">最新版本可用：v{{ updateInfo.latestVersion }}</h3>
      </div>
      <div class="bg-morandi-panel/60 p-4 border border-black/5 text-xs text-morandi-text leading-relaxed whitespace-pre-line font-sans">
        {{ updateInfo.changelog }}
      </div>
      <button 
        @click="startUpdate"
        class="w-full py-2.5 bg-morandi-green text-morandi-text hover:bg-morandi-green/80 text-[10px] uppercase tracking-widest transition-all font-bold"
      >
        立即安装并升级
      </button>
    </div>

    <!-- 下载进度面板 -->
    <div v-if="isDownloading" class="bg-white p-6 border border-black/5 space-y-4 animate-fade-in">
      <div class="flex justify-between items-center text-[10px] text-morandi-text">
        <span class="font-bold">{{ progressText }}</span>
        <span class="font-bold text-morandi-green">{{ downloadProgress }}%</span>
      </div>
      <div class="w-full h-2 bg-morandi-panel overflow-hidden border border-black/5">
        <div 
          class="h-full bg-morandi-green transition-all duration-150 ease-out" 
          :style="{ width: `${downloadProgress}%` }"
        ></div>
      </div>
      <p v-if="downloadError" class="text-[10px] text-red-500 font-medium">
        下载失败：{{ downloadError }}
      </p>
      <p class="text-[10px] text-morandi-muted font-sans">
        正在为您流式下载升级安装包。下载完成后软件将自动关闭并进行安装。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const currentVersion = ref('1.1.0') // 初始默认版本号，随后检查更新时会从主进程获取
const isChecking = ref(false)
const hasUpdate = ref(false)
const isDownloading = ref(false)
const downloadProgress = ref(0)
const showLatestMsg = ref(false)
const checkError = ref(null)
const downloadError = ref(null)

const updateInfo = ref({
  latestVersion: '',
  changelog: '',
  downloadUrl: ''
})

let cleanupProgress = null

const progressText = computed(() => {
  if (downloadError.value) return '下载出错'
  if (downloadProgress.value === 100) return '正在准备安装...'
  return '正在下载更新包...'
})

const handleCheckUpdate = async () => {
  isChecking.value = true
  hasUpdate.value = false
  showLatestMsg.value = false
  checkError.value = null
  downloadError.value = null

  try {
    if (window.electronAPI && window.electronAPI.checkUpdate) {
      const res = await window.electronAPI.checkUpdate()
      if (res.error) {
        throw new Error(res.error)
      }
      
      if (res.currentVersion) {
        currentVersion.value = res.currentVersion
      }

      if (res.hasUpdate) {
        hasUpdate.value = true
        updateInfo.value = {
          latestVersion: res.latestVersion,
          changelog: res.changelog,
          downloadUrl: res.downloadUrl
        }
      } else {
        showLatestMsg.value = true
        setTimeout(() => {
          showLatestMsg.value = false
        }, 5000)
      }
    } else {
      throw new Error('未检测到更新接口')
    }
  } catch (err) {
    checkError.value = err.message
  } finally {
    isChecking.value = false
  }
}

const startUpdate = async () => {
  isDownloading.value = true
  downloadProgress.value = 0
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
  // 仅在挂载时悄悄获取一次当前版本号，不触发网络加载与检查
  if (window.electronAPI && window.electronAPI.checkUpdate) {
    // 我们可以触发检查，但通常最好只是显示当前版本，
    // 为了省去加载状态，我们可以从以前打包过的常量获取，
    // 或者直接在此处以静默方式获取主进程的版本
    // 主进程 manualCheck() 会拉取 update.json 导致网络等待，
    // 我们在这里先直接从 checkUpdate 获取，也可以在 main.js 中增加单独获取版本的 API，
    // 不过在 manualCheck 响应速度快的情况下静默执行一次也是可以的，
    // 让我们做一次静默更新版本号：
    window.electronAPI.checkUpdate().then(res => {
      if (res && res.currentVersion) {
        currentVersion.value = res.currentVersion
      }
    }).catch(() => {})
  }

  // 监听下载进度更新
  if (window.electronAPI && window.electronAPI.onDownloadProgress) {
    cleanupProgress = window.electronAPI.onDownloadProgress((val) => {
      downloadProgress.value = val
    })
  }
})

onUnmounted(() => {
  if (cleanupProgress) cleanupProgress()
})
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
