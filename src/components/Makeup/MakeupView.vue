<template>
  <div class="space-y-10">
    <!-- 上部：名称与核心描述 -->
    <div>
      <h2 class="text-luxury-title-lg text-morandi-text mb-4">{{ makeup?.name }}</h2>
      <div v-if="makeup?.tags && makeup.tags.length > 0" class="text-luxury-meta-lg text-morandi-muted mt-2 mb-6 select-none">
        <span v-for="(tag, index) in makeup.tags" :key="tag">
          <span class="text-morandi-text">{{ tag }}</span><span v-if="index < makeup.tags.length - 1" class="mx-3 text-morandi-muted/30">·</span>
        </span>
      </div>
      
      <!-- 描述 -->
      <div v-if="makeup?.description" class="text-xs text-morandi-text/80 leading-relaxed font-sans whitespace-pre-wrap mt-4">
        {{ makeup.description }}
      </div>
    </div>

    <!-- 下部：图片集 (细节特写，两列瀑布) -->
    <div v-if="makeup?.images?.length">
      <h3 class="text-luxury-meta-sm text-morandi-muted mb-4 border-b border-black/5 pb-2 font-bold">细节特写照片 / DETAILS</h3>
      <div class="space-y-3">
         <div v-for="(row, rowIdx) in chunkArray(makeup.images, 2)" :key="rowIdx" class="flex gap-3 items-start">
           <div 
             v-for="(img, imgIdx) in row" 
             :key="imgIdx" 
             class="bg-black/5 overflow-hidden cursor-zoom-in rounded-sm shadow-sm"
             :style="{ flex: `${img.ratio || 1} 1 0%` }"
             @click="$emit('preview', img.url || img)"
           >
             <img :src="img.url || img" class="w-full h-auto block hover:opacity-90 transition-opacity" />
           </div>
           <div v-if="row.length < 2" :style="{ flex: `${2 - row.length} 1 0%` }" class="invisible"></div>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { chunkArray } from '../../utils/helpers'

defineProps({
  makeup: {
    type: Object,
    default: null
  }
})

defineEmits(['preview'])
</script>
