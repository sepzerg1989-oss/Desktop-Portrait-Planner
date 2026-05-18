<template>
  <div>
    <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">主题名称 / THEME TITLE</label>
    <input v-model="formData.title" type="text" class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30 mb-4" />
    
    <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">描述说明 / DESCRIPTION</label>
    <textarea v-model="formData.description" rows="3" class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30 mb-6"></textarea>
    
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
