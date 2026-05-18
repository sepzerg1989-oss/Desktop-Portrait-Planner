<template>
  <div class="relative w-full">
    <!-- 上传进度遮罩 -->
    <div v-if="isUploading" class="absolute inset-0 z-50 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
      <div class="w-8 h-8 mb-2 relative">
        <div class="absolute inset-0 border-2 border-morandi-blue/20 rounded-full"></div>
        <div class="absolute inset-0 border-2 border-morandi-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
      <span class="text-[10px] font-bold text-morandi-blue">{{ Math.round((uploadProgress.current / uploadProgress.total) * 100) || 0 }}%</span>
    </div>

    <!-- 单图模式 -->
    <div v-if="!multi"
      class="border-2 border-dashed border-morandi-blue/30 bg-morandi-blue/5 flex items-center justify-center text-morandi-blue text-sm cursor-pointer hover:bg-morandi-blue/10 transition-colors relative overflow-hidden group"
      :class="heightClass"
      @click="onSelect"
      @dragover.prevent
      @drop.prevent="onDrop"
      @mouseenter="$emit('mouseenter')"
      tabindex="0"
    >
      <template v-if="modelValue && (modelValue.url || modelValue.path || typeof modelValue === 'string')">
        <img :src="modelValue.url || modelValue" class="absolute inset-0 w-full h-full object-contain" />
        <div @click.stop="onRemove" class="absolute top-2 right-2 bg-red-400 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer z-10 transition-opacity">×</div>
      </template>
      <span v-else class="text-center px-4">{{ placeholder }}</span>
    </div>

    <!-- 多图模式 -->
    <div v-else
      class="border-2 border-dashed border-morandi-blue/30 bg-morandi-blue/5 min-h-[120px] p-4 flex flex-col items-center justify-center text-morandi-blue text-sm cursor-pointer hover:bg-morandi-blue/10 transition-colors"
      @click="onSelect"
      @dragover.prevent
      @drop.prevent="onDrop"
      @mouseenter="$emit('mouseenter')"
      tabindex="0"
    >
      <span v-if="!modelValue?.length" class="text-morandi-blue/60 pointer-events-none">+ 添加图片</span>
      
      <draggable 
        v-if="modelValue?.length" 
        v-model="editableImages" 
        item-key="url" 
        class="w-full grid gap-3 grid-cols-[repeat(auto-fill,minmax(70px,1fr))]"
        animation="200"
      >
        <template #item="{ element: img, index: idx }">
          <div class="relative group aspect-square bg-white shadow-sm overflow-hidden border border-black/5" @click.stop>
            <img :src="img.url || img" class="w-full h-full object-cover" />
            <button @click.stop="onRemove(idx)" class="absolute top-1 right-1 w-5 h-5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] z-20">×</button>
          </div>
        </template>
        <template #footer>
          <div class="aspect-square border-2 border-dashed border-morandi-blue/20 flex flex-col items-center justify-center text-morandi-blue/40 hover:border-morandi-blue/40 hover:text-morandi-blue/60 transition-all bg-white/50 cursor-pointer" @click.stop="onSelect">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
            </svg>
            <span class="text-[10px] uppercase tracking-tighter">Add</span>
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { useImageUpload } from '../../composables/useImageUpload'

const props = defineProps({
  modelValue: {
    type: [Object, String, Array],
    default: null
  },
  multi: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: '点击或拖拽上传图片'
  },
  heightClass: {
    type: String,
    default: 'h-40'
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'mouseenter', 'remove'])

const editableImages = computed({
  get: () => Array.isArray(props.modelValue) ? props.modelValue : [],
  set: (val) => {
    emit('update:modelValue', val)
    emit('change', val)
  }
})

const { isUploading, uploadProgress, handleDrop, handlePaste, selectPhotos, deleteImage } = useImageUpload()

const onSelect = async () => {
  if (isUploading.value) return
  const newImages = await selectPhotos(props.category, props.multi)
  emitChanges(newImages)
}

const onDrop = async (e) => {
  if (isUploading.value) return
  const newImages = await handleDrop(e, props.category)
  emitChanges(newImages)
}

const emitChanges = (newImages) => {
  if (!newImages || newImages.length === 0) return
  
  if (props.multi) {
    const current = Array.isArray(props.modelValue) ? props.modelValue : []
    emit('update:modelValue', [...current, ...newImages])
    emit('change', [...current, ...newImages])
  } else {
    emit('update:modelValue', newImages[0])
    emit('change', newImages[0])
  }
}

const onRemove = async (idx) => {
  if (props.multi) {
    const img = props.modelValue[idx]
    const path = typeof img === 'string' ? img : (img.path || img.url)
    if (path) await deleteImage(path)
    
    const newArray = [...props.modelValue]
    const removed = newArray.splice(idx, 1)[0]
    emit('update:modelValue', newArray)
    emit('change', newArray)
    emit('remove', removed)
  } else {
    const path = typeof props.modelValue === 'string' ? props.modelValue : (props.modelValue.path || props.modelValue.url)
    if (path) await deleteImage(path)
    const removed = props.modelValue
    emit('update:modelValue', null)
    emit('change', null)
    emit('remove', removed)
  }
}

defineExpose({
  handlePaste,
  isUploading,
  emitChanges
})
</script>
