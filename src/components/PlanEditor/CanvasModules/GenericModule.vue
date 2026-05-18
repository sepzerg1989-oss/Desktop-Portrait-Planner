<template>
  <div class="mb-0">
    <!-- 自定义模块/服装/道具模块 -->
    <div v-if="module.type === 'custom' || module.type === 'clothing' || module.type === 'props'">
      <div class="mb-8">
        <h3 class="text-xs uppercase tracking-[0.2em] text-morandi-muted mb-2">{{ module.type === 'custom' ? 'Custom' : module.type }}</h3>
        <h2 class="text-3xl font-serif text-morandi-text mb-4">{{ module.title }}</h2>
        <p class="text-morandi-text leading-relaxed whitespace-pre-wrap">{{ module.data.description || '暂无描述' }}</p>
      </div>
      
      <!-- 图片区域 -->
      <div v-if="module.data.images?.length" class="space-y-4">
        <div v-for="(row, rowIdx) in chunkArray(module.data.images, 3)" :key="rowIdx" class="flex gap-4 items-start">
          <div 
            v-for="(img, imgIdx) in row" 
            :key="img.url || img" 
            class="bg-black/5 overflow-hidden relative group transition-all duration-500"
            :class="{ 'cursor-move': isEditing }"
            :style="{ flex: `${img.ratio || 1} 1 0%` }"
            :draggable="isEditing" 
            @dragstart="$emit('dragstart', $event, module, rowIdx * 3 + imgIdx)" 
            @dragover.prevent="$emit('dragover', $event, rowIdx * 3 + imgIdx)" 
            @drop.prevent="$emit('drop', $event, module, rowIdx * 3 + imgIdx)"
            @dragend="$emit('dragend')"
          >
            <img :src="img.url || img" draggable="false" class="w-full h-auto block" :class="{ 'opacity-40 scale-95': draggingIdx === (rowIdx * 3 + imgIdx) && draggedModuleId === module.id }" loading="lazy" />
            <button v-if="isEditing" @click.stop="$emit('remove-image', module, rowIdx * 3 + imgIdx)" class="absolute top-2 right-2 w-6 h-6 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs z-20 shadow-md hover:bg-red-600" title="删除图片">×</button>
          </div>
          <div v-if="row.length < 3" :style="{ flex: `${3 - row.length} 1 0%` }" class="invisible"></div>
        </div>
      </div>
    </div>

    <!-- 参考样片模块 -->
    <div v-if="module.type === 'reference'">
      <h3 class="text-[10px] uppercase tracking-[0.3em] text-morandi-muted mb-6 text-center font-bold">参考样片 / REFERENCE</h3>
      <div v-if="module.data.images?.length" class="space-y-4">
        <div v-for="(row, rowIdx) in chunkArray(module.data.images, 3)" :key="rowIdx" class="flex gap-4 items-start">
          <div 
            v-for="(img, imgIdx) in row" 
            :key="img.url || img" 
            class="bg-black/5 overflow-hidden relative group transition-all duration-500"
            :class="{ 'cursor-move': isEditing }"
            :style="{ flex: `${img.ratio || 1} 1 0%` }"
            :draggable="isEditing" 
            @dragstart="$emit('dragstart', $event, module, rowIdx * 3 + imgIdx)" 
            @dragover.prevent="$emit('dragover', $event, rowIdx * 3 + imgIdx)" 
            @drop.prevent="$emit('drop', $event, module, rowIdx * 3 + imgIdx)"
            @dragend="$emit('dragend')"
          >
            <img :src="img.url || img" draggable="false" class="w-full h-auto block transition-opacity hover:opacity-95" :class="{ 'opacity-40 scale-95': draggingIdx === (rowIdx * 3 + imgIdx) && draggedModuleId === module.id }" loading="lazy" />
            <button v-if="isEditing" @click.stop="$emit('remove-image', module, rowIdx * 3 + imgIdx)" class="absolute top-2 right-2 w-6 h-6 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs z-20 shadow-md hover:bg-red-600" title="删除图片">×</button>
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
