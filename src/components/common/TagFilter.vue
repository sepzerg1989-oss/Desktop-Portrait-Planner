<template>
  <div v-if="tags.length > 0" class="flex flex-wrap gap-2 py-1 items-center">
    <button 
      @click="clearTags"
      :class="[
        'px-3 py-1 rounded-full border text-[10px] tracking-wider transition-all duration-300 whitespace-nowrap outline-none',
        modelValue.length === 0 
          ? 'bg-morandi-text text-morandi-paper border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.03)]' 
          : 'bg-transparent border-black/10 text-morandi-muted hover:text-morandi-text hover:bg-black/5'
      ]"
    >
      全部标签
    </button>
    <button 
      v-for="tag in displayedTags" :key="tag"
      @click="toggleTag(tag)"
      :class="[
        'px-3 py-1 rounded-full border text-[10px] tracking-wider transition-all duration-300 whitespace-nowrap outline-none',
        modelValue.includes(tag) 
          ? 'bg-morandi-text text-morandi-paper border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.03)]' 
          : 'bg-transparent border-black/10 text-morandi-muted hover:text-morandi-text hover:bg-black/5'
      ]"
    >
      {{ tag }}
    </button>

    <!-- 展开折叠切换按钮 -->
    <button 
      v-if="tags.length > 3"
      @click="isTagsExpanded = !isTagsExpanded"
      class="px-2 py-1 text-[10px] text-morandi-muted hover:text-morandi-text transition-colors flex items-center gap-1 outline-none"
    >
      <span>{{ isTagsExpanded ? '收起' : '更多' }}</span>
      <span class="text-[8px]">{{ isTagsExpanded ? '▲' : '▼' }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  // 所有可用常用标签列表 (通常已按频次排序)
  tags: {
    type: Array,
    default: () => []
  },
  // 当前选中的标签列表 (双向绑定)
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const isTagsExpanded = ref(false)

// 智能显示折叠与置顶逻辑
const displayedTags = computed(() => {
  if (isTagsExpanded.value) {
    return props.tags
  }
  const selected = props.tags.filter(t => props.modelValue.includes(t))
  const remaining = props.tags.filter(t => !props.modelValue.includes(t))
  const combined = [...selected, ...remaining]
  // 至少展示 3 个标签，如果有更多选中的标签则全都展示，保证被选标签永远可见
  return combined.slice(0, Math.max(3, selected.length))
})

const toggleTag = (tag) => {
  const next = [...props.modelValue]
  const idx = next.indexOf(tag)
  if (idx > -1) {
    next.splice(idx, 1)
  } else {
    next.push(tag)
  }
  emit('update:modelValue', next)
}

const clearTags = () => {
  emit('update:modelValue', [])
}
</script>
