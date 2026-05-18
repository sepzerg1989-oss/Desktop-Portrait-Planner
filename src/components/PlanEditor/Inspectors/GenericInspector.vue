<template>
  <div class="space-y-6">
    <div v-if="moduleType === 'custom'">
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">模块名称 / TITLE</label>
      <input 
        :value="moduleTitle" 
        @input="$emit('update:title', $event.target.value)"
        type="text" 
        class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30" 
        placeholder="输入自定义模块名称..."
      />
    </div>
    <div v-if="moduleType !== 'reference'">
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">描述说明 / DESCRIPTION</label>
      <textarea v-model="formData.description" rows="4" class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30" placeholder="填写详细说明..."></textarea>
    </div>
    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">
        {{ moduleType === 'reference' ? '参考样片 / REFERENCE' : '图片内容 / PHOTOS' }}
      </label>
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
  },
  moduleType: {
    type: String,
    required: true
  },
  moduleTitle: {
    type: String,
    default: ''
  }
})

defineEmits(['update:title'])

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
