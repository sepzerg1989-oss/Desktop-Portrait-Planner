<template>
  <div class="h-full bg-morandi-canvas p-12 flex flex-col items-center justify-start">
    <div class="w-full max-w-4xl bg-white border border-black/10 flex min-h-[540px] overflow-hidden animate-fade-in">
      
      <!-- 左侧边栏 - 导航区域 -->
      <aside class="w-48 bg-morandi-panel/40 border-r border-black/5 p-6 flex flex-col justify-between shrink-0">
        <div class="space-y-6">
          <!-- 标题区 -->
          <header class="border-b border-black/5 pb-4">
            <h1 class="font-serif text-lg font-bold text-morandi-text">全局设置</h1>
          </header>
 
          <!-- Tab 选项菜单 -->
          <nav class="flex flex-col space-y-1 font-sans">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'w-full flex items-center px-4 py-2.5 transition-all duration-200 text-left relative',
                activeTab === tab.id 
                  ? 'bg-morandi-text text-white font-medium' 
                  : 'text-morandi-text hover:bg-morandi-panel hover:translate-x-0.5'
              ]"
            >
              <!-- 文本 -->
              <span class="text-xs">{{ tab.name }}</span>
            </button>
          </nav>
        </div>
 
        <!-- 底部返回按钮 -->
        <div class="border-t border-black/5 pt-4 font-sans">
          <button 
            @click="$router.back()" 
            class="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-white border border-black/10 hover:border-morandi-text hover:bg-[#F5F5F5] text-morandi-muted hover:text-morandi-text transition-all active:scale-95 text-[10px] tracking-wider font-bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>返回主页</span>
          </button>
        </div>
      </aside>
 
      <!-- 右侧主内容展示区 -->
      <main class="flex-1 p-8 bg-white overflow-y-auto">
        <transition name="fade" mode="out-in">
          <component :is="activeComponent" :key="activeTab" />
        </transition>
      </main>
 
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import StorageSettings from '../components/settings/StorageSettings.vue'
import DataExchangeSettings from '../components/settings/DataExchangeSettings.vue'
import UpdateSettings from '../components/settings/UpdateSettings.vue'

const tabs = [
  {
    id: 'storage',
    name: '存储位置',
    component: StorageSettings
  },
  {
    id: 'exchange',
    name: '导入导出',
    component: DataExchangeSettings
  },
  {
    id: 'update',
    name: '软件更新',
    component: UpdateSettings
  }
]

const activeTab = ref('storage')

const activeComponent = computed(() => {
  const active = tabs.find(t => t.id === activeTab.value)
  return active ? active.component : null
})
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 优雅的内容切换淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}
</style>
