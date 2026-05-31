<template>
  <div>
    <div class="flex gap-2 mb-6">
      <button 
        @click="$emit('toggle-library')"
        class="flex-1 py-3 bg-morandi-text text-morandi-canvas text-[10px] uppercase tracking-widest rounded-full hover:opacity-90 transition-all outline-none font-medium shadow-sm"
      >
        从妆容库导入
      </button>
      <button 
        @click="$emit('save-library')"
        class="px-5 py-3 border border-morandi-text text-morandi-text text-[10px] uppercase tracking-widest rounded-full hover:bg-morandi-text hover:text-morandi-canvas transition-all outline-none font-medium"
        title="同步到全局妆面造型库"
      >
        存入素材库
      </button>
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">妆容名称 / NAME</label>
        <input v-model="formData.name" type="text" class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-sm text-morandi-text rounded-none" />
      </div>

      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">彩妆与造型说明 / DESCRIPTION</label>
        <textarea v-model="formData.description" rows="3" class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-sm text-morandi-text rounded-none resize-none font-sans"></textarea>
      </div>

      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">妆容标签 / TAGS (逗号分隔)</label>
        <input v-model="formData.tagsInput" type="text" class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-sm text-morandi-text rounded-none" />
      </div>

      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">特写及细节照片 / PHOTOS</label>
        <ImageUploader 
          v-model="formData.images" 
          :category="category" 
          :multi="true" 
          @mouseenter="onAreaMouseEnter"
          @mouseleave="onAreaMouseLeave"
          ref="imagesUploaderRef"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ImageUploader from '../../common/ImageUploader.vue'
import { usePasteTarget } from '../../../composables/usePasteTarget'

const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  category: {
    type: String,
    required: true
  }
})

defineEmits(['toggle-library', 'save-library'])

const imagesUploaderRef = ref(null)

const { activate, deactivate } = usePasteTarget()

const handlePaste = async (e) => {
  const uploader = imagesUploaderRef.value
  if (uploader && uploader.handlePaste) {
    if (uploader.isUploading) return
    const newImages = await uploader.handlePaste(e, props.category)
    if (newImages && newImages.length > 0) {
      uploader.emitChanges(newImages)
    }
  }
}

const onAreaMouseEnter = () => {
  activate(handlePaste)
}

const onAreaMouseLeave = () => {
  deactivate()
}
</script>
