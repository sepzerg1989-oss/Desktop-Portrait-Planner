<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
      <div class="bg-morandi-paper w-full max-w-md shadow-2xl p-8 animate-in fade-in zoom-in duration-300 border border-morandi-border rounded-none">
        <h3 class="font-serif text-xl text-morandi-text mb-2">{{ title }}</h3>
        <p class="text-[10px] uppercase tracking-widest text-morandi-muted mb-6">
          {{ subTitle || (type === 'confirm' ? 'Confirmation Required' : 'Action Required') }}
        </p>
        
        <p class="text-xs text-morandi-muted mb-8 leading-relaxed">{{ message }}</p>
        
        <div v-if="type === 'prompt'" class="mb-8">
          <input 
            v-model="inputValue" 
            type="text" 
            class="w-full px-1 py-3 border-b border-morandi-border bg-transparent outline-none focus:border-morandi-text text-sm text-morandi-text rounded-none"
            autofocus
            @keyup.enter="handleConfirm"
          />
        </div>

        <div class="flex justify-end gap-3">
          <button 
            v-if="type !== 'alert'"
            @click="handleCancel" 
            class="px-6 py-2 text-[11px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors font-medium outline-none"
          >
            {{ cancelText || '取消' }}
          </button>
          <button 
            @click="handleConfirm" 
            class="px-6 py-2 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity font-medium outline-none shadow-sm"
          >
            {{ confirmText || (type === 'confirm' ? '确定删除' : '确定') }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  subTitle: { type: String, default: '' },
  type: { type: String, default: 'alert' },
  inputValue: { type: String, default: '' },
  cancelText: { type: String, default: '' },
  confirmText: { type: String, default: '' },
  onConfirm: { type: Function, default: null },
  onCancel: { type: Function, default: null }
})

const emit = defineEmits(['update:show', 'update:inputValue', 'confirm', 'cancel'])

const inputValue = ref(props.inputValue)

watch(() => props.inputValue, (val) => {
  inputValue.value = val
})

const handleConfirm = async () => {
  if (props.onConfirm) {
    await props.onConfirm(inputValue.value)
  }
  emit('confirm', inputValue.value)
  emit('update:show', false)
}

const handleCancel = () => {
  if (props.onCancel) {
    props.onCancel()
  }
  emit('cancel')
  emit('update:show', false)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>