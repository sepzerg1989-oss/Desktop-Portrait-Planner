<template>
  <transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- 遮罩 -->
      <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" @click="cancel"></div>
      
      <!-- 弹窗主体 -->
      <div class="relative bg-white shadow-2xl border border-black/5 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="p-8">
          <div class="flex items-center space-x-4 mb-6">
            <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="font-serif text-xl text-morandi-text">{{ title }}</h3>
          </div>
          <p class="text-sm text-morandi-muted leading-relaxed mb-8">
            {{ message }}
          </p>
          
          <div class="flex justify-end space-x-3">
            <button 
              @click="cancel" 
              class="px-5 py-2 text-xs uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors"
            >
              取消 Cancel
            </button>
            <button 
              @click="confirm" 
              class="px-6 py-2 text-xs uppercase tracking-widest bg-morandi-text text-white hover:bg-black/80 transition-colors shadow-lg shadow-black/5"
            >
              确认 Confirm
            </button>
          </div>
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
