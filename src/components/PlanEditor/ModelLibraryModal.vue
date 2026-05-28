<template>
  <transition name="fade">
    <div v-if="show" class="absolute inset-0 z-[60] bg-white flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b border-black/5 flex justify-between items-center bg-morandi-canvas/30">
        <div>
          <h3 class="font-serif text-lg">素材库选择</h3>
          <p class="text-[10px] text-morandi-muted uppercase tracking-widest">Select from library</p>
        </div>
        <button @click="$emit('close')" class="text-morandi-muted hover:text-morandi-text">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 轻量化筛选栏 (置顶搜索 + 地区 + Tag 胶囊) -->
      <div class="px-6 py-4 border-b border-black/5 bg-morandi-canvas/10 space-y-3 shrink-0">
        <div class="flex items-center gap-3">
          <!-- 搜索框 -->
          <div class="relative flex-1">
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="搜索姓名、标签..."
              class="w-full px-3 py-2 border border-black/10 bg-transparent outline-none focus:border-morandi-text text-xs transition-colors font-sans"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-morandi-muted hover:text-morandi-text text-sm">×</button>
          </div>

          <!-- 地区筛选 -->
          <div class="relative w-[100px] flex-shrink-0">
            <select 
              v-model="selectedRegion"
              class="w-full px-3 py-2 border border-black/10 bg-transparent outline-none focus:border-morandi-text text-xs transition-colors font-sans appearance-none cursor-pointer text-morandi-text"
            >
              <option value="">全部地区</option>
              <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
            </select>
            <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-morandi-muted text-[10px]">
              ▼
            </div>
          </div>
        </div>

        <!-- 常用 Tag 滑动条 -->
        <div v-if="topTags.length > 0" class="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          <button 
            @click="selectedTag = ''"
            :class="[
              'px-3 py-1 text-[10px] tracking-wider transition-all duration-300 border whitespace-nowrap',
              selectedTag === '' 
                ? 'bg-morandi-text text-white border-transparent' 
                : 'bg-transparent border-black/10 text-morandi-text hover:border-morandi-text'
            ]"
          >
            全部标签
          </button>
          <button 
            v-for="tag in topTags" :key="tag"
            @click="selectedTag = tag"
            :class="[
              'px-3 py-1 text-[10px] tracking-wider transition-all duration-300 border whitespace-nowrap',
              selectedTag === tag 
                ? 'bg-morandi-text text-white border-transparent' 
                : 'bg-transparent border-black/10 text-morandi-text hover:border-morandi-text'
            ]"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- 列表区 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2 scroll-thin">
        <div 
          v-for="model in filteredModels" 
          :key="model.id"
          @click="$emit('import', model)"
          class="flex items-center p-3 border border-black/5 hover:border-morandi-blue hover:bg-morandi-blue/5 cursor-pointer transition-all group bg-transparent"
        >
          <div class="w-12 h-12 bg-black/5 flex-shrink-0 mr-4 overflow-hidden">
            <img v-if="model.avatarURL" :src="model.avatarURL" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1">
            <div class="text-sm font-medium text-morandi-text">{{ model.name }}</div>
            <div class="text-[10px] text-morandi-muted font-sans mt-0.5">
              <span class="mr-2">{{ model.region || '未知地区' }}</span>
              <span v-if="model.price" class="mr-2">· {{ model.price }}</span>
              <span v-if="model.tags && model.tags.length > 0" class="text-gray-400">· {{ model.tags.slice(0, 2).join(', ') }}</span>
            </div>
          </div>
          <div class="opacity-0 group-hover:opacity-100 text-morandi-blue text-[10px] uppercase tracking-widest font-bold">选择</div>
        </div>
        <div v-if="filteredModels.length === 0" class="py-10 text-center text-xs text-morandi-muted font-sans">
          暂无匹配的模特数据
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useModelStore } from '../../store/modelStore'

defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'import'])

const modelStore = useModelStore()

// 过滤状态
const searchQuery = ref('')
const selectedRegion = ref('')
const selectedTag = ref('')

// 地区提取
const regions = computed(() => {
  const all = modelStore.models.map(m => m.region).filter(Boolean)
  return [...new Set(all)]
})

// 最常用前 6 个 Tag
const topTags = computed(() => {
  const all = modelStore.models.flatMap(m => m.tags || []).filter(Boolean)
  const counts = {}
  all.forEach(t => counts[t] = (counts[t] || 0) + 1)
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 6)
})

// 过滤计算
const filteredModels = computed(() => {
  return modelStore.models.filter(m => {
    const matchesSearch = !searchQuery.value.trim() || 
      m.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchQuery.value.toLowerCase()))
    
    const matchesRegion = !selectedRegion.value || m.region === selectedRegion.value
    
    const matchesTag = !selectedTag.value || m.tags.includes(selectedTag.value)
    
    return matchesSearch && matchesRegion && matchesTag
  })
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 隐藏横向滚动条 */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
