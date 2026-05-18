<template>
  <div>
    <div class="flex gap-2 mb-6">
      <button 
        @click="$emit('toggle-library')"
        class="flex-1 py-3 bg-morandi-text text-white text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors"
      >
        从素材库导入场地
      </button>
      <button 
        @click="$emit('save-library')"
        class="flex-1 py-3 border border-morandi-text text-morandi-text text-[10px] uppercase tracking-widest hover:bg-morandi-text hover:text-white transition-colors"
      >
        存入素材库
      </button>
    </div>
    <div class="space-y-4">
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">场地名称 / NAME</label>
        <input v-model="formData.name" type="text" class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30" />
      </div>
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">详细地址 / ADDRESS</label>
        <input v-model="formData.address" type="text" class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30" />
      </div>
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">分类标签 / TAGS</label>
        <input v-model="formData.tagsInput" type="text" placeholder="如: 复古, 极简" class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30" />
      </div>
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">场地照片 / PHOTOS</label>
        <ImageUploader 
        v-model="formData.images" 
        :category="category" 
        :multi="true" 
        ref="uploaderRef"
        @mouseenter="onUploaderMouseEnter"
        @mouseleave="onUploaderMouseLeave"
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
