<template>
  <div class="title-bar flex items-center justify-between px-4 h-8 bg-morandi-canvas border-b border-black/5 select-none relative z-[1000]">
    <!-- 拖拽区域 -->
    <div class="drag-region absolute inset-0"></div>
    
    <!-- 居中标题 -->
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2 pointer-events-none z-10">
      <img src="../../assets/logo.png" class="w-4 h-4 opacity-80" alt="Logo" />
      <span class="text-[10px] uppercase tracking-[0.3em] text-morandi-text/80 font-medium">Portrait Planner</span>
    </div>

    <!-- 左侧占位（以保持原有的 flex 结构） -->
    <div></div>

    <!-- 右侧控制按钮 (Windows/Linux) -->
    <div v-if="!isMac" class="flex items-center h-full relative z-10">
      <button @click="minimize" class="control-btn hover:bg-black/5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>
      <button @click="toggleMaximize" class="control-btn hover:bg-black/5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="1" stroke-width="2" />
        </svg>
      </button>
      <button @click="close" class="control-btn hover:bg-red-500 hover:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isMac = ref(false)

onMounted(() => {
  isMac.value = window.navigator.platform.toUpperCase().indexOf('MAC') >= 0
})

const minimize = () => window.electronAPI.window.minimize()
const toggleMaximize = () => window.electronAPI.window.toggleMaximize()
const close = () => window.electronAPI.window.close()
</script>

<style scoped>
.title-bar {
  /* 防止文字被选中 */
  -webkit-user-select: none;
  user-select: none;
}

.drag-region {
  /* 标记为可拖拽区域 */
  -webkit-app-region: drag;
}

.control-btn {
  @apply w-10 h-full flex items-center justify-center transition-colors text-morandi-muted;
  /* 按钮区域本身不能拖拽，否则无法点击 */
  -webkit-app-region: no-drag;
}
</style>
