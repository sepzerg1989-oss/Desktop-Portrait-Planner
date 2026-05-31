<template>
  <transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- 遮罩 -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cancel"></div>
      
      <!-- 弹窗主体 (高奢直角卡纸与复合阴影) -->
      <div class="relative bg-morandi-paper shadow-2xl border border-morandi-border w-full max-w-sm p-8 animate-in zoom-in-95 duration-200 rounded-none">
        <h3 class="text-xl font-serif text-morandi-text mb-2">{{ title }}</h3>
        <p class="text-[10px] uppercase tracking-widest text-morandi-muted mb-6">Confirmation Required</p>
        
        <p class="text-xs text-morandi-muted leading-relaxed mb-8">
          {{ message }}
        </p>
        
        <div class="flex justify-end gap-3">
          <button 
            @click="cancel" 
            class="px-6 py-2 text-[11px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors font-medium outline-none"
          >
            取消 Cancel
          </button>
          <button 
            @click="confirm" 
            class="px-6 py-2 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity font-medium outline-none shadow-sm"
          >
            确认 Confirm
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
const props = defineProps({
  isOpen: Boolean,
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    default: '你确定要执行此操作吗？'
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const confirm = () => emit('confirm')
const cancel = () => emit('cancel')
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
