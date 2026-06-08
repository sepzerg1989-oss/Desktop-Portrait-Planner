<template>
  <div class="mb-0">
    <div>
      <div class="flex items-start space-x-12 mb-12">
        <!-- 左侧：无边框原比例图片（参考模特页面，支持拖拽和就地删除） -->
        <div 
          v-if="getCover()"
          class="w-48 bg-black/5 flex-shrink-0 shadow-lg overflow-hidden relative group transition-all duration-500"
          :class="{ 'cursor-move': isEditing }"
          :draggable="isEditing" 
          @dragstart="$emit('dragstart', $event, module, 0)" 
          @dragover.prevent="$emit('dragover', $event, 0)" 
          @drop.prevent="$emit('drop', $event, module, 0)"
          @dragend="$emit('dragend')"
        >
          <img :src="getCover()" draggable="false" class="w-full h-auto block" :class="{ 'opacity-40 scale-95': draggingIdx === 0 && draggedModuleId === module.id }" loading="lazy" />
          
          <!-- 首图移除按钮 (极简直角暗房风格) -->
          <button 
            v-if="isEditing" 
            @click.stop="$emit('remove-image', module, 0)" 
            class="absolute top-2 right-2 w-5 h-5 bg-morandi-text/80 hover:bg-morandi-red text-morandi-canvas opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[10px] z-20 shadow-md outline-none rounded-none" 
            title="移除封面照片"
          >
            ×
          </button>
        </div>

        <!-- 右侧：文字参数说明 -->
        <div class="flex-1 min-w-0">
          <div class="mb-4">
            <h3 class="text-luxury-meta-sm text-morandi-muted font-bold">妆面造型 / MAKEUP LOOK</h3>
          </div>
          <h2 class="text-luxury-title-lg text-morandi-text mb-4">{{ module.data.name }}</h2>

          <div v-if="module.data.tags && module.data.tags.length > 0" class="text-luxury-meta-lg text-morandi-muted mb-6 select-none">
            <span v-for="(tag, index) in module.data.tags" :key="tag">
              <span class="text-morandi-text">{{ tag }}</span>
              <span v-if="index < module.data.tags.length - 1" class="mx-3 text-morandi-muted/30">·</span>
            </span>
          </div>

          <div v-if="module.data.description" class="text-xs text-morandi-muted/90 font-sans leading-relaxed whitespace-pre-wrap mt-4">
            {{ module.data.description }}
          </div>
        </div>
      </div>

      <!-- 底部：妆面其它特写照片图册 -->
      <div v-if="module.data.images?.length > 1" class="space-y-4 pt-4 border-t border-morandi-border/10">
        <h4 class="text-luxury-meta-sm text-morandi-muted mb-4 text-center font-bold">妆面局部特写 / DETAILS GALLERY</h4>
        <div v-for="(row, rowIdx) in chunkArray(module.data.images.slice(1), 3)" :key="rowIdx" class="flex gap-4 items-start">
          <div 
            v-for="(img, imgIdx) in row" 
            :key="img.url || img" 
            class="bg-black/5 overflow-hidden relative group transition-all duration-500 rounded-[2px]"
            :class="{ 'cursor-move': isEditing }"
            :style="{ flex: `${img.ratio || 1}` }"
            :draggable="isEditing" 
            @dragstart="$emit('dragstart', $event, module, rowIdx * 3 + imgIdx + 1)" 
            @dragover.prevent="$emit('dragover', $event, rowIdx * 3 + imgIdx + 1)" 
            @drop.prevent="$emit('drop', $event, module, rowIdx * 3 + imgIdx + 1)"
            @dragend="$emit('dragend')"
          >
            <img :src="img.url || img" draggable="false" class="w-full h-auto block" :class="{ 'opacity-40 scale-95': draggingIdx === (rowIdx * 3 + imgIdx + 1) && draggedModuleId === module.id }" loading="lazy" />
            
            <!-- 细节图移除按钮 (极简直角暗房风格) -->
            <button 
              v-if="isEditing" 
              @click.stop="$emit('remove-image', module, rowIdx * 3 + imgIdx + 1)" 
              class="absolute top-2 right-2 w-5 h-5 bg-morandi-text/80 hover:bg-morandi-red text-morandi-canvas opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[10px] z-20 shadow-md outline-none rounded-none" 
              title="删除细节图片"
            >
              ×
            </button>
          </div>
          <div v-if="row.length < 3" :style="{ flex: `${3 - row.length} 1 0%` }" class="invisible"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { chunkArray } from '../../../utils/helpers'

const props = defineProps({
  module: Object,
  isEditing: Boolean,
  draggingIdx: Number,
  draggedModuleId: String
})

defineEmits(['dragstart', 'dragover', 'drop', 'dragend', 'remove-image'])

// 默认首图提取作为封面
const getCover = () => {
  if (props.module.data.images && props.module.data.images.length > 0) {
    const firstImg = props.module.data.images[0]
    return firstImg.url || firstImg.path || firstImg
  }
  return ''
}
</script>
