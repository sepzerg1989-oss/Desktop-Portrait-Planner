<template>
  <div class="space-y-6">
    <div class="border-b border-black/5 pb-4">
      <h2 class="text-sm font-bold text-morandi-text">存储位置</h2>
      <p class="text-xs text-morandi-muted leading-relaxed mt-2 font-sans">
        设置策划案数据、模特库与场地库图片的本地存储文件夹。你可以随时更改此目录，系统会自动在新位置初始化必要的文件夹。
      </p>
    </div>

    <div class="bg-morandi-panel p-6 border border-black/5 flex items-center justify-between group">
      <div class="flex-1 min-w-0 mr-6">
        <div class="text-[10px] text-morandi-muted uppercase tracking-widest mb-1 font-sans">当前路径</div>
        <div class="text-xs text-morandi-text truncate font-mono bg-white/80 border border-black/5 px-3 py-1.5 inline-block" :title="currentPath">
          {{ currentPath || '未设置' }}
        </div>
      </div>
      <button 
        @click="handleSelectPath"
        class="shrink-0 px-6 py-2.5 bg-morandi-text text-white text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95"
      >
        更改目录
      </button>
    </div>

    <div v-if="showSuccess" class="bg-transparent text-green-700 text-[10px] p-4 border border-green-600/30 animate-fade-in flex items-center font-sans">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      存储路径更改成功，新设置已即时生效。
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePlanStore } from '../../store/planStore'
import { useModelStore } from '../../store/modelStore'
import { useLocationStore } from '../../store/locationStore'

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
