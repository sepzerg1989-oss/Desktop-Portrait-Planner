<template>
  <div ref="filterPanelRef" class="flex flex-wrap items-center gap-4 relative">
    <!-- 搜索框 -->
    <div class="relative w-[180px]">
      <input 
        :value="searchQuery"
        @input="$emit('update:searchQuery', $event.target.value)"
        type="text" 
        placeholder="搜索姓名、标签..." 
        class="w-full px-1 py-2 border-b border-morandi-border bg-transparent outline-none focus:border-morandi-text text-xs transition-colors font-sans rounded-none"
      />
      <button 
        v-if="searchQuery" 
        @click="$emit('update:searchQuery', '')"
        class="absolute right-1 top-1/2 -translate-y-1/2 text-morandi-muted hover:text-morandi-text text-sm"
      >
        ×
      </button>
    </div>

    <!-- 地区下拉框 (高奢自定义) -->
    <div v-if="showRegion" class="relative w-[110px]">
      <CustomSelect 
        :modelValue="selectedRegion"
        @update:modelValue="$emit('update:selectedRegion', $event)"
        :options="[{ value: '', label: '地区: 全部' }, ...regions]"
        placeholder="选择地区"
      />
    </div>
 
    <!-- 排序下拉框 (高奢自定义) -->
    <div v-if="sortOptions && sortOptions.length > 0" class="relative w-[90px]">
      <CustomSelect 
        :modelValue="selectedSort"
        @update:modelValue="$emit('update:selectedSort', $event)"
        :options="sortOptions"
        placeholder="排序"
        align="right"
      />
    </div>

    <!-- 标签筛选按钮 -->
    <button 
      v-if="tags && tags.length > 0"
      @click="isCollapsed = !isCollapsed"
      :class="['px-1 py-2 border-b text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5 rounded-none bg-transparent',
        !isCollapsed ? 'border-morandi-text text-morandi-text' : 'border-morandi-border text-morandi-muted hover:text-morandi-text hover:border-morandi-text'
      ]"
    >
      <span>标签</span>
      <span>{{ isCollapsed ? '▼' : '▲' }}</span>
    </button>
    
    <!-- 重置按钮 -->
    <button 
      @click="resetAll"
      :class="['px-1 py-2 text-[10px] uppercase tracking-widest text-morandi-red hover:text-morandi-text active:scale-95 transition-all select-none',
        hasActiveFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      ]"
    >
      重置 RESET
    </button>

    <!-- 标签下拉面板 (绝对定位悬浮，重塑为高奢直角卡纸与幽灵胶囊) -->
    <transition name="fade">
      <div v-if="!isCollapsed && tags && tags.length > 0" class="absolute top-full left-0 mt-2 w-[320px] bg-morandi-paper border border-morandi-border p-5 shadow-[0_16px_40px_rgba(0,0,0,0.04)] z-50 rounded-none">
        <div class="text-[10px] text-morandi-muted tracking-[0.2em] mb-4 select-none">按常用标签筛选：</div>
        <div class="flex flex-wrap gap-2.5 max-h-[200px] overflow-y-auto pr-2 scroll-thin">
          <button 
            v-for="tag in tags" 
            :key="tag"
            @click="toggleTag(tag)"
            :class="[
              'px-4 py-1.5 rounded-full border text-xs tracking-wider transition-all duration-300 outline-none',
              selectedTags.includes(tag)
                ? 'bg-morandi-text text-morandi-paper border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
                : 'bg-transparent border-morandi-text/10 text-morandi-muted hover:text-morandi-text hover:bg-morandi-text/5'
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
import CustomSelect from './CustomSelect.vue'

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
