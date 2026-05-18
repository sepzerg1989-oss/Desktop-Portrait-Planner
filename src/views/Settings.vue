<template>
  <div class="h-full bg-morandi-canvas p-12 flex flex-col items-center">
    <div class="w-full max-w-3xl bg-white shadow-sm p-10 space-y-12">
      <!-- 页面标题 -->
      <header class="border-b border-black/5 pb-8">
        <h1 class="font-serif text-3xl text-morandi-text">全局设置</h1>
        <p class="text-xs text-morandi-muted mt-2 uppercase tracking-[0.2em]">Global Settings & Preferences</p>
      </header>

      <!-- 数据存储设置 -->
      <section class="space-y-6">
        <div>
          <h2 class="text-sm font-bold text-morandi-text uppercase tracking-widest mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            数据存储目录
          </h2>
          <p class="text-xs text-morandi-muted leading-relaxed mb-6">
            Portrait Planner 将所有的策划案数据、模特库图片、场地库图片以及导出的文件存储在以下目录中。
            你可以随时更改此目录，系统会自动在新位置初始化必要的文件夹。
          </p>
        </div>

        <div class="bg-morandi-canvas/30 p-6 border border-black/5 flex items-center justify-between group">
          <div class="flex-1 min-w-0 mr-6">
            <div class="text-[10px] text-morandi-muted uppercase tracking-widest mb-1">当前路径</div>
            <div class="text-sm text-morandi-text truncate font-mono bg-white/50 px-2 py-1 inline-block rounded" :title="currentPath">
              {{ currentPath || '未设置' }}
            </div>
          </div>
          <button 
            @click="handleSelectPath"
            class="shrink-0 px-6 py-2 bg-morandi-text text-white text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
          >
            更改目录
          </button>
        </div>

        <div v-if="showSuccess" class="bg-green-50 text-green-600 text-[10px] p-4 border border-green-100 animate-fade-in flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          存储路径更改成功，新设置已即时生效。
        </div>
      </section>

      <!-- 其他设置占位 -->
      <section class="pt-8 border-t border-black/5 opacity-50">
        <h2 class="text-[10px] font-bold text-morandi-muted uppercase tracking-[0.3em] mb-4 text-center">More features coming soon</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="h-12 border border-dashed border-black/10 rounded flex items-center justify-center text-[10px] text-morandi-muted uppercase tracking-widest">
            云端备份
          </div>
          <div class="h-12 border border-dashed border-black/10 rounded flex items-center justify-center text-[10px] text-morandi-muted uppercase tracking-widest">
            多端同步
          </div>
        </div>
      </section>
    </div>

    <!-- 返回按钮 -->
    <button 
      @click="$router.back()" 
      class="mt-10 text-morandi-muted hover:text-morandi-text transition-colors flex items-center space-x-2 text-xs uppercase tracking-widest"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span>返回</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePlanStore } from '../store/planStore'
import { useModelStore } from '../store/modelStore'
import { useLocationStore } from '../store/locationStore'

const planStore = usePlanStore()
const modelStore = useModelStore()
const locationStore = useLocationStore()

const currentPath = ref('')
const showSuccess = ref(false)

const loadPath = async () => {
  currentPath.value = await window.electronAPI.workspace.getPath()
}

const handleSelectPath = async () => {
  const res = await window.electronAPI.workspace.selectAndSet()
  if (res.success) {
    currentPath.value = res.path
    showSuccess.value = true
    await Promise.all([
      planStore.fetchPlans(),
      modelStore.fetchAll(),
      locationStore.fetchAll(),
    ])
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  }
}

onMounted(loadPath)
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
