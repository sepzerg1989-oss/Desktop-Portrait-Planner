<template>
  <transition name="slide-up">
    <div 
      v-if="show" 
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] w-full max-w-2xl px-6 py-4 bg-white/95 backdrop-blur-md border border-black/10 flex items-center justify-between shadow-lg"
    >
      <!-- 左侧状态信息 -->
      <div class="flex items-center space-x-4">
        <!-- 装饰小圆点 -->
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B9D8B] opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-[#8B9D8B]"></span>
        </span>
        <span class="text-xs text-morandi-muted font-sans uppercase tracking-widest">
          已选择 <span class="font-sans text-xs text-morandi-text font-bold mx-1">{{ selectedCount }}</span> 项
        </span>
      </div>

      <!-- 右侧控制按钮组 -->
      <div class="flex items-center space-x-3">
        <!-- 全选/取消全选 -->
        <button 
          @click="$emit('toggle-all')"
          class="px-4 py-2 border border-black/10 text-[11px] uppercase tracking-widest text-morandi-text hover:bg-morandi-canvas active:scale-95 transition-all"
        >
          {{ isAllSelected ? '取消全选' : '全选此页' }}
        </button>

        <!-- 取消管理 -->
        <button 
          @click="$emit('cancel')"
          class="px-4 py-2 border border-transparent text-[11px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text active:scale-95 transition-all"
        >
          取消
        </button>

        <!-- 批量删除 (警告红/深木色高亮) -->
        <button 
          @click="$emit('delete')"
          :disabled="selectedCount === 0"
          class="px-6 py-2 bg-[#A34A4A] disabled:bg-gray-300 text-white text-[11px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center space-x-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>批量删除 ({{ selectedCount }})</span>
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  selectedCount: { type: Number, default: 0 },
  isAllSelected: { type: Boolean, default: false }
})

defineEmits(['toggle-all', 'cancel', 'delete'])
</script>

<script>
// 声明莫兰迪配色
// bg-[#A34A4A] 为优雅莫兰迪红
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translate(-50%, 100px) scale(0.95);
  opacity: 0;
}
</style>
