<template>
  <transition name="fade">
    <div v-if="show" class="absolute inset-0 z-[60] bg-morandi-panel flex flex-col text-morandi-text">
      <!-- Header -->
      <div class="p-6 border-b border-morandi-border flex justify-between items-center bg-morandi-canvas/30 text-morandi-text">
        <div>
          <h3 class="font-serif text-lg">道具库选择</h3>
          <p class="text-[10px] text-morandi-muted uppercase tracking-widest">Select from props library</p>
        </div>
        <button @click="$emit('close')" class="text-morandi-muted hover:text-morandi-text">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 轻量化筛选栏 -->
      <div class="px-6 py-4 border-b border-morandi-border bg-morandi-canvas/10 space-y-3 shrink-0">
        <div class="flex items-center gap-4">
          <!-- 搜索框 -->
          <div class="relative flex-1">
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="搜索名称、描述、标签..."
              class="w-full px-1 py-2 border-b border-morandi-border bg-transparent outline-none focus:border-morandi-text text-xs transition-colors font-sans text-morandi-text rounded-none"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-1 top-1/2 -translate-y-1/2 text-morandi-muted hover:text-morandi-text text-sm">×</button>
          </div>
        </div>

        <!-- 常用 Tag 过滤组件 -->
        <TagFilter v-model="selectedTags" :tags="topTags" />
      </div>

      <!-- 列表区 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2 scroll-thin">
        <div 
          v-for="item in filteredProps" 
          :key="item.id"
          @click="$emit('import', item)"
          class="flex items-center p-3 border-b border-morandi-border/30 hover:bg-morandi-canvas/30 cursor-pointer transition-all group bg-transparent rounded-none"
        >
          <div class="w-12 h-12 bg-black/5 flex-shrink-0 mr-4 overflow-hidden rounded-sm relative">
            <img v-if="item.coverURL" :src="item.coverURL" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1 min-w-0 pr-2">
            <div class="text-sm font-medium text-morandi-text truncate">{{ item.name }}</div>
            <div class="text-[10px] text-morandi-muted font-sans mt-0.5 truncate">
              <span v-if="item.price" class="mr-2 text-morandi-text">{{ item.price }}</span>
              <span v-if="item.description" class="mr-2 text-morandi-muted/80">· {{ item.description }}</span>
              <span v-if="item.tags && item.tags.length > 0" class="text-morandi-muted">· {{ item.tags.slice(0, 2).join(', ') }}</span>
            </div>
          </div>
          <div class="opacity-0 group-hover:opacity-100 text-morandi-blue text-[10px] uppercase tracking-widest font-bold flex-shrink-0">选择</div>
        </div>
        <div v-if="filteredProps.length === 0" class="py-10 text-center text-xs text-morandi-muted font-sans">
          暂无匹配的道具数据
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePropsStore } from '../../store/propsStore'
import TagFilter from '../common/TagFilter.vue'

defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'import'])

const propsStore = usePropsStore()

const searchQuery = ref('')
const selectedTags = ref([])

// 最常用前 15 个 Tag
const topTags = computed(() => {
  const all = propsStore.propsList.flatMap(p => p.tags || []).filter(Boolean)
  const counts = {}
  all.forEach(t => counts[t] = (counts[t] || 0) + 1)
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 15)
})

// 过滤计算
const filteredProps = computed(() => {
  return propsStore.propsList.filter(p => {
    const matchesSearch = !searchQuery.value.trim() || 
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery.value.toLowerCase())))
    
    const matchesTag = selectedTags.value.length === 0 || 
      (p.tags && selectedTags.value.some(tag => p.tags.includes(tag)))
    
    return matchesSearch && matchesTag
  })
})

onMounted(async () => {
  await propsStore.fetchAll()
  for (const item of propsStore.propsList) {
    if (item.images && item.images.length > 0) {
      const firstImg = item.images[0]
      const path = typeof firstImg === 'string' ? firstImg : (firstImg.path || firstImg.url)
      item.coverURL = await window.electronAPI.imageToURL(path)
    }
  }
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
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
