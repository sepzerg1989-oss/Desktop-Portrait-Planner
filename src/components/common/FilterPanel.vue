<template>
  <div ref="filterPanelRef" class="flex flex-wrap items-center gap-3 relative">
    <!-- 搜索框 -->
    <div class="relative w-[180px]">
      <input 
        :value="searchQuery"
        @input="$emit('update:searchQuery', $event.target.value)"
        type="text" 
        placeholder="搜索姓名、标签..." 
        class="w-full px-3 py-2 border border-black/10 bg-transparent outline-none focus:border-morandi-text text-xs transition-colors font-sans"
      />
      <button 
        v-if="searchQuery" 
        @click="$emit('update:searchQuery', '')"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-morandi-muted hover:text-morandi-text text-sm"
      >
        ×
      </button>
    </div>

    <!-- 地区下拉框 -->
    <div v-if="showRegion" class="relative w-[110px]">
      <select 
        :value="selectedRegion"
        @change="$emit('update:selectedRegion', $event.target.value)"
        class="w-full px-3 py-2 border border-black/10 bg-transparent outline-none focus:border-morandi-text text-xs transition-colors font-sans appearance-none cursor-pointer text-morandi-text"
      >
        <option value="">地区: 全部</option>
        <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
      </select>
      <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-morandi-muted text-[10px]">
        ▼
      </div>
    </div>

    <!-- 排序下拉框 -->
    <div v-if="sortOptions && sortOptions.length > 0" class="relative w-[90px]">
      <select 
        :value="selectedSort"
        @change="$emit('update:selectedSort', $event.target.value)"
        class="w-full px-3 py-2 border border-black/10 bg-transparent outline-none focus:border-morandi-text text-xs transition-colors font-sans appearance-none cursor-pointer text-morandi-text"
      >
        <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-morandi-muted text-[10px]">
        ▼
      </div>
    </div>

    <!-- 标签筛选按钮 -->
    <button 
      v-if="tags && tags.length > 0"
      @click="isCollapsed = !isCollapsed"
      :class="['px-3 py-2 border text-[10px] uppercase tracking-widest hover:border-morandi-text transition-all flex items-center gap-1.5',
        !isCollapsed ? 'border-morandi-text text-morandi-text' : 'border-black/10 text-morandi-muted hover:text-morandi-text'
      ]"
    >
      <span>标签</span>
      <span>{{ isCollapsed ? '▼' : '▲' }}</span>
    </button>
    
    <!-- 重置按钮 -->
    <button 
      @click="resetAll"
      :class="['px-3 py-2 text-[10px] uppercase tracking-widest text-[#A34A4A] hover:bg-black/5 active:scale-95 transition-all select-none',
        hasActiveFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      ]"
    >
      重置 RESET
    </button>

    <!-- 标签下拉面板 (绝对定位悬浮) -->
    <transition name="fade">
      <div v-if="!isCollapsed && tags && tags.length > 0" class="absolute top-full left-0 mt-2 w-[320px] bg-[#F9F9F9] border border-black/10 p-4 shadow-xl z-50">
        <div class="text-[10px] text-morandi-muted uppercase tracking-widest mb-3 select-none">按常用标签筛选：</div>
        <div class="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-2 scroll-thin">
          <button 
            v-for="tag in tags" 
            :key="tag"
            @click="toggleTag(tag)"
            :class="[
              'px-3 py-1 text-[10px] tracking-wider transition-all duration-300 border',
              selectedTags.includes(tag)
                ? 'bg-morandi-text text-white border-transparent'
                : 'bg-transparent border-black/10 text-morandi-text hover:border-morandi-text'
            ]"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  searchQuery: { type: String, default: '' },
  selectedRegion: { type: String, default: '' },
  selectedTags: { type: Array, default: () => [] },
  regions: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] },
  showRegion: { type: Boolean, default: true },
  selectedSort: { type: String, default: '' },
  sortOptions: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'update:searchQuery', 
  'update:selectedRegion', 
  'update:selectedTags',
  'update:selectedSort',
  'reset'
])

const filterPanelRef = ref(null)

// 默认收起
const isCollapsed = ref(true)

const handleClickOutside = (event) => {
  if (filterPanelRef.value && !filterPanelRef.value.contains(event.target)) {
    isCollapsed.value = true
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const hasActiveFilters = computed(() => {
  return props.searchQuery.trim() !== '' || 
         props.selectedRegion !== '' || 
         props.selectedTags.length > 0
})

const toggleTag = (tag) => {
  const next = [...props.selectedTags]
  const idx = next.indexOf(tag)
  if (idx === -1) {
    next.push(tag)
  } else {
    next.splice(idx, 1)
  }
  emit('update:selectedTags', next)
}

const resetAll = () => {
  emit('update:searchQuery', '')
  emit('update:selectedRegion', '')
  emit('update:selectedTags', [])
  emit('reset')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
