<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[120] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
      <div class="bg-morandi-paper w-full max-w-md shadow-2xl p-8 animate-in fade-in zoom-in duration-300 border border-morandi-border rounded-none">
        <h3 class="font-serif text-xl text-morandi-text mb-2">继续在后台运行</h3>
        <p class="text-[10px] uppercase tracking-widest text-morandi-muted mb-6">
          Background Mode
        </p>

        <p class="text-xs text-morandi-muted mb-7 leading-relaxed">
          Portrait Planner 会收进{{ targetLabel }}，你可以随时从{{ targetLabel }}图标重新打开。
        </p>

        <button
          type="button"
          class="flex items-center gap-3 text-xs text-morandi-muted hover:text-morandi-text transition-colors outline-none mb-8"
          @click="dontShowAgain = !dontShowAgain"
        >
          <span
            class="w-4 h-4 border rounded-[2px] flex items-center justify-center transition-all"
            :class="dontShowAgain
              ? 'bg-morandi-text border-morandi-text text-morandi-canvas'
              : 'bg-transparent border-morandi-text/20 text-transparent'"
          >
            <span class="text-[10px] leading-none">✓</span>
          </span>
          <span>以后不再提示</span>
        </button>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="handleQuit"
            class="px-6 py-2 text-[11px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors font-medium outline-none"
          >
            直接退出
          </button>
          <button
            type="button"
            @click="handleHide"
            class="px-6 py-2 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity font-medium outline-none shadow-sm"
          >
            收进{{ targetLabel }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  targetLabel: { type: String, default: '系统托盘' }
})

const emit = defineEmits(['hide', 'quit'])

const dontShowAgain = ref(false)

watch(
  () => props.show,
  (show) => {
    if (show) {
      dontShowAgain.value = false
    }
  }
)

const payload = computed(() => ({
  dontShowAgain: dontShowAgain.value
}))

const handleHide = () => {
  emit('hide', payload.value)
}

const handleQuit = () => {
  emit('quit', payload.value)
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
