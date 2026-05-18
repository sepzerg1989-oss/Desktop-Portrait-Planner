<template>
  <transition name="fade">
    <div v-if="show" class="absolute inset-0 z-[60] bg-white flex flex-col">
      <div class="p-6 border-b border-black/5 flex justify-between items-center bg-morandi-canvas/30">
        <div>
          <h3 class="font-serif text-lg">素材库选择</h3>
          <p class="text-[10px] text-morandi-muted uppercase tracking-widest">Select from library</p>
        </div>
        <button @click="$emit('close')" class="text-morandi-muted hover:text-morandi-text">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-4 space-y-2">
        <div 
          v-for="model in modelStore.models" 
          :key="model.id"
          @click="$emit('import', model)"
          class="flex items-center p-3 border border-black/5 hover:border-morandi-blue hover:bg-morandi-blue/5 cursor-pointer transition-all group"
        >
          <div class="w-12 h-12 bg-black/5 flex-shrink-0 mr-4 overflow-hidden">
            <img v-if="model.avatarURL" :src="model.avatarURL" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1">
            <div class="text-sm font-medium text-morandi-text">{{ model.name }}</div>
            <div class="text-[10px] text-morandi-muted">{{ model.region || '未知地区' }} · {{ model.price || '0' }}/h</div>
          </div>
          <div class="opacity-0 group-hover:opacity-100 text-morandi-blue text-[10px] uppercase tracking-widest">选择</div>
        </div>
        <div v-if="modelStore.models.length === 0" class="py-10 text-center text-xs text-morandi-muted">
          模特库暂无数据
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useModelStore } from '../../store/modelStore'

defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'import'])

const modelStore = useModelStore()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
