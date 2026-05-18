<template>
  <div class="mb-0">
    <div class="flex items-start space-x-12 mb-12">
      <div class="w-64 bg-black/5 flex-shrink-0 shadow-lg overflow-hidden relative group">
        <img v-if="module.data.avatar" :src="module.data.avatar" class="w-full h-auto block hover:scale-105 transition-all duration-700" loading="lazy" />
        <button v-if="isEditing && module.data.avatar" @click.stop="module.data.avatar = ''; $emit('save')" class="absolute top-2 right-2 w-6 h-6 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs z-20 shadow-md hover:bg-red-600" title="移除头像">×</button>
      </div>
      <div class="flex-1">
        <div class="mb-4">
          <h3 class="text-[10px] uppercase tracking-[0.3em] text-morandi-muted font-bold">模特 / THE MUSE</h3>
        </div>
        <h2 class="text-5xl font-serif text-morandi-text mb-6">{{ module.data.name }}</h2>
        
        <div class="space-y-4 mb-8">
          <div class="flex flex-wrap gap-2">
            <span v-for="tag in module.data.tags" :key="tag" class="px-3 py-1 border border-black/5 text-[10px] uppercase tracking-widest text-morandi-text">{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 模卡展示 -->
    <div v-if="module.data.modelCard" class="mb-12">
      <h3 class="text-[10px] uppercase tracking-[0.3em] text-morandi-muted mb-4 text-center font-bold">模特卡 / MODEL CARD</h3>
      <div class="bg-black/5 overflow-hidden shadow-md relative group">
        <img :src="module.data.modelCard" class="w-full h-auto block" loading="lazy" />
        <button v-if="isEditing" @click.stop="module.data.modelCard = ''; $emit('save')" class="absolute top-4 right-4 w-8 h-8 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm z-20 shadow-md hover:bg-red-600" title="移除模特卡">×</button>
      </div>
    </div>

    <!-- 模特照片库 -->
    <div v-if="module.data.images?.length" class="space-y-4">
      <h3 class="text-[10px] uppercase tracking-[0.3em] text-morandi-muted mb-4 text-center font-bold">作品照片 / PHOTOS</h3>
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
          <img :src="img.url || img" draggable="false" class="w-full h-auto block transition-all hover:opacity-90" :class="{ 'opacity-40 scale-95': draggingIdx === (rowIdx * 3 + imgIdx) && draggedModuleId === module.id }" loading="lazy" />
          <button v-if="isEditing" @click.stop="$emit('remove-image', module, rowIdx * 3 + imgIdx)" class="absolute top-2 right-2 w-6 h-6 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs z-20 shadow-md hover:bg-red-600" title="删除图片">×</button>
        </div>
        <div v-if="row.length < 3" :style="{ flex: `${3 - row.length} 1 0%` }" class="invisible"></div>
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

defineEmits(['dragstart', 'dragover', 'drop', 'dragend', 'remove-image', 'save'])
</script>
