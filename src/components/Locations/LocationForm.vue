<template>
  <div class="space-y-8 pb-10">
    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">场地名称 / VENUE</label>
      <input v-model="formData.name" type="text" class="w-full px-4 py-3 bg-white border border-black/5 focus:border-morandi-blue outline-none transition-colors" placeholder="输入场地名称" />
    </div>
    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">详细地址 / ADDRESS</label>
      <input v-model="formData.address" type="text" class="w-full px-4 py-3 bg-white border border-black/5 focus:border-morandi-blue outline-none transition-colors" placeholder="输入场地地址" />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">价格 / PRICE</label>
        <input v-model="formData.price" type="text" class="w-full px-4 py-3 bg-white border border-black/5 focus:border-morandi-blue outline-none transition-colors" placeholder="如: ￥300/h" />
      </div>
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">分类标签 / TAGS</label>
        <input v-model="formData.tagsInput" type="text" class="w-full px-4 py-3 bg-white border border-black/5 focus:border-morandi-blue outline-none transition-colors" placeholder="如: 自然光, 北欧" />
      </div>
    </div>

    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">场地照片 / PHOTOS</label>
      <ImageUploader 
        v-model="formData.images" 
        :category="category" 
        :multi="true"
        ref="imagesUploaderRef"
        @mouseenter="onUploaderMouseEnter"
        @mouseleave="onUploaderMouseLeave"
        @change="updateCover"
        @remove="updateCover"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import ImageUploader from '../common/ImageUploader.vue'
import { usePasteTarget } from '../../composables/usePasteTarget'

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

const imagesUploaderRef = ref(null)
const { activate, deactivate } = usePasteTarget()

const updateCover = () => {
  if (props.formData.images && props.formData.images.length > 0) {
    const firstImg = props.formData.images[0]
    props.formData.cover_path = firstImg.path || firstImg.url
    props.formData.coverPreview = firstImg.url || firstImg
  } else {
    props.formData.cover_path = ''
    props.formData.coverPreview = ''
  }
}

const handlePaste = async (e) => {
  if (imagesUploaderRef.value && imagesUploaderRef.value.handlePaste) {
    if (imagesUploaderRef.value.isUploading) return
    const newImages = await imagesUploaderRef.value.handlePaste(e, props.category)
    if (newImages && newImages.length > 0) {
      imagesUploaderRef.value.emitChanges(newImages)
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
