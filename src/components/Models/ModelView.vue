<template>
  <div class="space-y-10">
    <!-- 上部：头像(左) + 信息(右) -->
    <div class="flex items-start">
      <div 
        v-if="model?.avatarURL"
        class="w-32 bg-black/5 shadow-lg overflow-hidden flex-shrink-0 cursor-zoom-in"
        @click="$emit('preview', model.avatarURL)"
      >
        <img :src="model.avatarURL" class="w-full h-auto block" />
      </div>
      <div v-else class="w-32 h-40 bg-black/5 flex-shrink-0 flex items-center justify-center text-morandi-muted/30 text-3xl font-serif">
        {{ model?.name?.charAt(0) || '?' }}
      </div>
      
      <div class="flex-1 pl-8">
        <h2 class="text-4xl font-serif text-morandi-text mb-4">{{ model?.name }}</h2>
        <div class="flex flex-wrap gap-2 mb-6">
          <span v-for="tag in model?.tags" :key="tag" class="px-2 py-1 text-[10px] uppercase tracking-wider bg-black/5 text-morandi-text border border-black/5">
            {{ tag }}
          </span>
        </div>
        <div class="space-y-3 text-sm text-morandi-muted/80">
          <p v-if="model?.region" class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ model.region }}
          </p>
          <p v-if="model?.price" class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ model.price }} /h
          </p>
          <p v-if="model?.social" class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ model.social }}
          </p>
        </div>
      </div>
    </div>

    <!-- 中部：模卡 (一整行) -->
    <div v-if="model?.modelCardURL" class="space-y-4">
      <h3 class="text-[10px] uppercase tracking-[0.3em] text-morandi-muted border-b border-black/5 pb-2 font-bold">模特卡 / MODEL CARD</h3>
      <div class="cursor-zoom-in overflow-hidden shadow-md" @click="$emit('preview', model.modelCardURL)">
        <img :src="model.modelCardURL" class="w-full h-auto block" />
      </div>
    </div>

    <!-- 下部：照片库 (两列) -->
    <div v-if="model?.images?.length">
      <h3 class="text-[10px] uppercase tracking-[0.3em] text-morandi-muted mb-4 border-b border-black/5 pb-2 font-bold">作品照片 / GALLERY</h3>
      <div class="space-y-3">
         <div v-for="(row, rowIdx) in chunkArray(model.images, 2)" :key="rowIdx" class="flex gap-3 items-start">
           <div 
             v-for="(img, imgIdx) in row" 
             :key="imgIdx" 
             class="bg-black/5 overflow-hidden cursor-zoom-in"
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
  model: {
    type: Object,
    default: null
  }
})

defineEmits(['preview'])
</script>
