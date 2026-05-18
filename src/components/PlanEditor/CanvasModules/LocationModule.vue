<template>
  <div class="mb-0">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h3 class="text-[10px] uppercase tracking-[0.3em] text-morandi-muted mb-2 font-bold">拍摄场地 / LOCATION</h3>
        <h2 class="text-3xl font-serif text-morandi-text">{{ module.data.name }}</h2>
      </div>
      <p class="text-xs text-morandi-muted italic">{{ module.data.address }}</p>
    </div>
    
    <div v-if="module.data.images?.length">
      <!-- 首图：英雄图 -->
      <div class="mb-4 overflow-hidden bg-black/5 relative group transition-all duration-500" 
        :class="{ 'cursor-move': isEditing }"
        :draggable="isEditing" 
        @dragstart="$emit('dragstart', $event, module, 0)" 
        @dragover.prevent="$emit('dragover', $event, 0)" 
        @drop.prevent="$emit('drop', $event, module, 0)"
        @dragend="$emit('dragend')"
      >
        <img :src="module.data.images[0].url || module.data.images[0]" draggable="false" class="w-full h-auto object-contain transition-all" :class="{ 'opacity-40 scale-[0.98] blur-[2px]': draggingIdx === 0 && draggedModuleId === module.id }" loading="lazy" />
        <button v-if="isEditing" @click.stop="$emit('remove-image', module, 0)" class="absolute top-4 right-4 w-8 h-8 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm z-20 shadow-md hover:bg-red-600" title="删除图片">×</button>
      </div>
      
      <!-- 其它图：等分行高三列布局 -->
      <div v-if="module.data.images.length > 1" class="space-y-4">
        <div v-for="(row, rowIdx) in chunkArray(module.data.images.slice(1), 3)" :key="rowIdx" class="flex gap-4 items-start">
          <div 
            v-for="(img, imgIdx) in row" 
            :key="img.url || img" 
            class="bg-black/5 overflow-hidden relative group transition-all duration-500"
            :class="{ 'cursor-move': isEditing }"
            :style="{ flex: `${img.ratio || 1} 1 0%` }"
            :draggable="isEditing" 
            @dragstart="$emit('dragstart', $event, module, rowIdx * 3 + imgIdx + 1)" 
            @dragover.prevent="$emit('dragover', $event, rowIdx * 3 + imgIdx + 1)" 
            @drop.prevent="$emit('drop', $event, module, rowIdx * 3 + imgIdx + 1)"
            @dragend="$emit('dragend')"
          >
            <img :src="img.url || img" draggable="false" class="w-full h-auto block transition-all" :class="{ 'opacity-40 scale-95': draggingIdx === (rowIdx * 3 + imgIdx + 1) && draggedModuleId === module.id }" loading="lazy" />
            <button v-if="isEditing" @click.stop="$emit('remove-image', module, rowIdx * 3 + imgIdx + 1)" class="absolute top-2 right-2 w-6 h-6 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs z-20 shadow-md hover:bg-red-600" title="删除图片">×</button>
          </div>
          <div v-if="row.length < 3" :style="{ flex: `${3 - row.length} 1 0%` }" class="invisible"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { chunkArray } from '../../../utils/helpers'

defineProps({
  module: Object,
  isEditing: Boolean,
  draggingIdx: Number,
  draggedModuleId: String
})

defineEmits(['dragstart', 'dragover', 'drop', 'dragend', 'remove-image'])
</script>
