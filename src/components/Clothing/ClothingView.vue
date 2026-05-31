<template>
  <div class="space-y-10">
    <!-- 上部：名称与核心描述 -->
    <div>
      <h2 class="text-luxury-title-lg text-morandi-text mb-4">{{ clothing?.name }}</h2>
      <div v-if="clothing?.tags && clothing.tags.length > 0" class="text-luxury-meta-lg text-morandi-muted mt-2 mb-6 select-none">
        <span v-for="(tag, index) in clothing.tags" :key="tag">
          <span class="text-morandi-text">{{ tag }}</span><span v-if="index < clothing.tags.length - 1" class="mx-3 text-morandi-muted/30">·</span>
        </span>
      </div>
      
      <!-- 描述 -->
      <div v-if="clothing?.description" class="p-6 bg-morandi-canvas/30 rounded-sm border border-morandi-border/20 text-xs text-morandi-text/80 leading-relaxed font-sans whitespace-pre-wrap">
        {{ clothing.description }}
      </div>

      <!-- 参数项 (价格与链接) -->
      <div class="mt-6 space-y-3 text-luxury-body text-morandi-muted/80">
        <p v-if="clothing?.price" class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-morandi-muted/70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-sans text-xs mr-1 font-bold">参考价格:</span>
          <span class="text-luxury-num text-morandi-text">{{ clothing.price }}</span>
        </p>
        <p v-if="clothing?.link" class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-morandi-muted/70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span class="font-sans text-xs mr-1 font-bold">来源链接:</span>
          <span class="text-morandi-text select-all font-mono truncate max-w-xs">{{ clothing.link }}</span>
        </p>
      </div>
    </div>

    <!-- 下部：图片集 (博物学图鉴多列) -->
    <div v-if="clothing?.images?.length">
      <h3 class="text-luxury-meta-sm text-morandi-muted mb-4 border-b border-black/5 pb-2 font-bold">服装照片 / LOOKBOOK</h3>
      <div class="space-y-3">
         <div v-for="(row, rowIdx) in chunkArray(clothing.images, 2)" :key="rowIdx" class="flex gap-3 items-start">
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
  clothing: {
    type: Object,
    default: null
  }
})

defineEmits(['preview'])
</script>
