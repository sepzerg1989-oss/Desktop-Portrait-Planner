<template>
  <div class="mb-0">
    <div class="mb-6">
      <h3 class="text-luxury-meta-sm text-morandi-muted font-bold">拍摄道具 / STAGE PROP</h3>
    </div>

    <!-- 暂无道具占位 -->
    <div v-if="isEmpty" class="py-8 text-center text-xs text-morandi-muted/60 font-sans select-none bg-morandi-canvas/5 border border-dashed border-morandi-border/30">
      {{ isEditing ? '请在右侧属性编辑面板“从素材库导入”或手动填写您的拍摄道具' : '暂无拍摄道具内容 / No Prop Added' }}
    </div>

    <!-- 画册三列等高展平连贯网格 -->
    <div v-else class="space-y-6">
      <div v-for="(row, rowIdx) in chunkArray(allImages, 3)" :key="rowIdx" class="flex gap-4 items-start">
        <div 
          v-for="(img, imgIdx) in row" 
          :key="imgIdx" 
          class="bg-transparent border-b border-morandi-border/20 pb-4 relative group transition-all duration-500 overflow-hidden"
          :class="{ 'cursor-move': isEditing && img.url }"
          :style="{ flex: `${img.ratio || 1.0} 1 0%` }"
          :draggable="isEditing && img.url" 
          @dragstart="$emit('dragstart', $event, module, img.flatIndex)" 
          @dragover.prevent="$emit('dragover', $event, img.flatIndex)" 
          @drop.prevent="$emit('drop', $event, module, img.flatIndex)"
          @dragend="$emit('dragend')"
        >
          <!-- 图片区 -->
          <div class="aspect-auto overflow-hidden bg-morandi-canvas/10 mb-3 rounded-[2px] border border-morandi-border/20 relative">
            <img v-if="img.url" :src="img.url" draggable="false" class="w-full h-auto block object-contain" :class="{ 'opacity-40 scale-95': draggingIdx === img.flatIndex && draggedModuleId === module.id }" loading="lazy" />
            <!-- 无图占位 (凹陷卡纸视觉) -->
            <div v-else class="w-full aspect-square flex items-center justify-center text-morandi-text/10 text-xl font-serif">
              {{ img.parent.name?.charAt(0) || 'P' }}
            </div>
          </div>

          <!-- 文字排版参数 (斜杠拼接，自动换行) -->
          <div class="border-t border-morandi-border/30 mt-3 pt-3 text-center px-1">
            <div class="font-serif text-[10px] text-morandi-text leading-relaxed whitespace-pre-wrap">
              <span class="font-bold">{{ img.parent.name || '未命名道具' }}</span>
              <span v-if="img.parent.tags && img.parent.tags.length > 0" class="text-morandi-muted font-sans font-normal text-[8px] tracking-wider">
                / {{ Array.isArray(img.parent.tags) ? img.parent.tags.join(' · ') : img.parent.tags }}
              </span>
              <span v-if="img.parent.description" class="text-morandi-muted font-sans font-normal text-[8.5px] leading-relaxed">
                / {{ img.parent.description }}
              </span>
            </div>
          </div>

          <!-- 移除按钮 (直角暗房风格，编辑状态下) -->
          <button 
            v-if="isEditing" 
            @click.stop="$emit('remove-image', module, { itemIndex: img.itemIndex, imgIndex: img.imgIndex })" 
            class="absolute top-2 right-2 w-5 h-5 bg-morandi-text/80 hover:bg-morandi-red text-morandi-canvas opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[10px] z-20 shadow-md outline-none rounded-none" 
            title="删除道具"
          >
            ×
          </button>
        </div>
        <!-- 占位符以对齐最后一行的宽度比例 -->
        <div v-if="row.length < 3" :style="{ flex: `${3 - row.length} 1 0%` }" class="invisible"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { chunkArray } from '../../../utils/helpers'

const props = defineProps({
  module: Object,
  isEditing: Boolean,
  draggingIdx: [Number, Object],
  draggedModuleId: String
})

defineEmits(['dragstart', 'dragover', 'drop', 'dragend', 'remove-image'])

// 检测空状态
const isEmpty = computed(() => {
  const items = props.module?.data?.items
  if (!items || items.length === 0) return true
  if (items.length === 1) {
    const item = items[0]
    return !item.name && (!item.images || item.images.length === 0)
  }
  return false
})

// 扁平化提取多张图片，绑定所属 Prop 元数据及扁平索引
const allImages = computed(() => {
  const list = []
  const items = props.module?.data?.items || []
  let globalFlatIdx = 0

  items.forEach((item, itemIdx) => {
    if (item.images && item.images.length > 0) {
      item.images.forEach((img, imgIdx) => {
        list.push({
          url: img.url || img.path || (typeof img === 'string' ? img : ''),
          ratio: img.ratio || 1.0, // 道具默认 1:1
          parent: item,
          itemIndex: itemIdx,
          imgIndex: imgIdx,
          flatIndex: globalFlatIdx++
        })
      })
    } else {
      // 占位无图卡片
      list.push({
        url: '',
        ratio: 1.0,
        parent: item,
        itemIndex: itemIdx,
        imgIndex: 0,
        flatIndex: globalFlatIdx++
      })
    }
  })

  return list
})
</script>
