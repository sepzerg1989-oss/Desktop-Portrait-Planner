<template>
  <div>
    <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">主题名称 / THEME TITLE</label>
    <input v-model="formData.title" type="text" class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-sm text-morandi-text mb-4 rounded-none" />
    
    <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">描述说明 / DESCRIPTION</label>
    <textarea v-model="formData.description" rows="3" class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-sm text-morandi-text mb-6 rounded-none resize-none"></textarea>
    
    <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">主题图片 / PHOTOS</label>
    <ImageUploader 
      v-model="formData.images" 
      :category="category" 
      :multi="true" 
      ref="uploaderRef"
      @mouseenter="onUploaderMouseEnter"
      @mouseleave="onUploaderMouseLeave"
    />
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

const uploaderRef = ref(null)
const { activate, deactivate } = usePasteTarget()

const handlePaste = async (e) => {
  if (uploaderRef.value && uploaderRef.value.handlePaste) {
    const newImages = await uploaderRef.value.handlePaste(e, props.category)
    if (newImages && newImages.length > 0) {
      uploaderRef.value.emitChanges(newImages)
    }
  }
}

const onUploaderMouseEnter = () => {
  activate(handlePaste)
}

const onUploaderMouseLeave = () => {
  deactivate()
}
</script>
