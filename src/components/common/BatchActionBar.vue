<template>
  <transition name="slide-up">
    <div 
      v-if="show" 
      class="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-5 px-6 py-3 bg-morandi-text text-morandi-paper rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.18)] select-none"
      style="width: auto; max-width: 90vw;"
    >
      <!-- 左侧：极细计数文字 -->
      <span class="text-[10px] font-sans uppercase tracking-[0.2em] text-morandi-paper/70 whitespace-nowrap">
        已选择 <span class="font-serif text-sm text-morandi-paper font-light mx-1">{{ selectedCount }}</span> 项
      </span>

      <!-- 中间：半透明竖分割线 -->
      <div class="w-[1px] h-4 bg-white/20 flex-shrink-0"></div>

      <!-- 全选/取消全选 幽灵胶囊 -->
      <button 
        @click="$emit('toggle-all')"
        class="rounded-full px-4 py-1 border border-white/20 text-[10px] uppercase tracking-widest text-morandi-paper/70 hover:text-morandi-paper hover:border-white/50 transition-all outline-none font-sans whitespace-nowrap"
      >
        {{ isAllSelected ? '取消全选' : '全选此页' }}
      </button>

      <!-- 中间：半透明竖分割线 -->
      <div class="w-[1px] h-4 bg-white/20 flex-shrink-0"></div>

      <!-- 低调退出文字按钮 -->
      <button 
        @click="$emit('cancel')"
        class="text-[10px] uppercase tracking-widest text-morandi-paper/50 hover:text-morandi-paper/90 transition-colors outline-none font-sans whitespace-nowrap"
      >
        退出
      </button>

      <!-- 批量删除警告胶囊 -->
      <button 
        @click="$emit('delete')"
        :disabled="selectedCount === 0"
        :class="[
          'rounded-full px-5 py-1.5 text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5 outline-none font-sans whitespace-nowrap',
          selectedCount === 0 
            ? 'bg-white/5 text-morandi-paper/20 border border-white/10 cursor-not-allowed'
            : 'bg-morandi-red text-white border border-transparent hover:opacity-90 cursor-pointer shadow-[0_2px_12px_rgba(163,74,74,0.3)] active:scale-95'
        ]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>删除 ({{ selectedCount }})</span>
      </button>
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
// bg-morandi-red 为优雅莫兰迪红
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
