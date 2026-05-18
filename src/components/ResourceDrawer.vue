<template>
  <transition name="slide">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end pt-8">
      <!-- 遮罩层 -->
      <div 
        class="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        @click="onOverlayClick"
      ></div>

      <!-- 抽屉本体 -->
      <div :class="['relative bg-morandi-canvas shadow-[0_0_50px_rgba(0,0,0,0.1)] flex flex-col h-full border-l border-black/5', width]">
        
        <!-- 头部 -->
        <div class="px-8 py-6 border-b border-black/5 flex justify-between items-center">
          <h2 class="font-serif text-2xl">{{ title }}</h2>
          <div class="flex items-center space-x-4">
            <slot name="header-actions"></slot>
            <button @click="close" class="text-morandi-muted hover:text-morandi-text transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 内容表单区 -->
        <div class="flex-1 overflow-y-auto px-8 py-6">
          <slot></slot>
        </div>

        <!-- 底部操作区 -->
        <div v-if="showFooter" class="px-8 py-4 bg-morandi-canvas border-t border-black/5 flex justify-end space-x-4">
          <slot name="footer">
            <button @click="close" class="px-6 py-2 text-sm text-morandi-muted hover:text-morandi-text border border-transparent hover:border-black/5 transition-all">
              取消
            </button>
            <button @click="save" class="px-6 py-2 text-sm text-white bg-morandi-text hover:bg-black/80 transition-colors">
              保存修改
            </button>
          </slot>
        </div>

      </div>
    </div>
  </transition>
</template>

<script setup>
const props = defineProps({
  isOpen: Boolean,
  title: String,
  width: {
    type: String,
    default: 'w-[480px]'
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  closeOnClickOutside: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'save'])

const onOverlayClick = () => {
  if (props.closeOnClickOutside) {
    close()
  }
}

const close = () => {
  emit('close')
}

const save = () => {
  emit('save')
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}
.slide-enter-from .relative,
.slide-leave-to .relative {
  transform: translateX(100%);
}
</style>
