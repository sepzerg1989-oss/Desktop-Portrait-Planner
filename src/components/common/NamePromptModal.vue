<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-morandi-paper p-8 shadow-2xl w-[400px] border border-morandi-border rounded-none animate-in fade-in zoom-in-95 duration-200">
        <h3 class="text-luxury-title-md text-morandi-text mb-2">{{ title }}</h3>
        <p class="text-luxury-meta-sm text-morandi-muted mb-6">{{ subTitle }}</p>
        <div class="mb-8">
          <label class="block text-luxury-meta-sm text-morandi-muted mb-2">{{ label }}</label>
          <input 
            :value="value"
            @input="handleInput"
            type="text" 
            class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-sm text-morandi-text rounded-none" 
            :placeholder="placeholder"
            autofocus
            @keyup.enter="handleConfirm"
          />
        </div>
        <div class="flex justify-end gap-3">
          <button @click="handleCancel" class="px-6 py-2 text-[11px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors font-medium outline-none">
            取消 / Cancel
          </button>
          <button 
            @click="handleConfirm" 
            class="px-6 py-2 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity font-medium outline-none shadow-sm"
          >
            确认 / Confirm
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
const props = defineProps({
  show: { type: Boolean, default: false },
  value: { type: String, default: '' },
  title: { type: String, default: '' },
  subTitle: { type: String, default: '' },
  label: { type: String, default: '名称' },
  placeholder: { type: String, default: '必填...' }
})

const emit = defineEmits(['update:show', 'update:value', 'confirm', 'cancel'])

const handleInput = (e) => {
  emit('update:value', e.target.value)
}

const handleConfirm = () => {
  const finalVal = (props.value || '').trim()
  emit('confirm', finalVal)
  emit('update:show', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:show', false)
}
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
