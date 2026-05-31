<template>
  <div class="space-y-6 pb-10">
    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">搭配名称 / NAME</label>
      <input v-model="formData.name" type="text" class="w-full px-1 py-3 bg-transparent border-b border-morandi-border/30 focus:border-morandi-text outline-none text-sm text-morandi-text transition-colors rounded-none" placeholder="输入服装搭配名称" />
    </div>
    
    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">搭配描述 / DESCRIPTION</label>
      <textarea v-model="formData.description" rows="3" class="w-full px-1 py-3 bg-transparent border-b border-morandi-border/30 focus:border-morandi-text outline-none text-sm text-morandi-text transition-colors rounded-none resize-none font-sans" placeholder="输入搭配说明、尺码版型、穿搭要点..."></textarea>
    </div>

    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">搭配标签 / TAGS</label>
      <input v-model="formData.tagsInput" type="text" class="w-full px-1 py-3 bg-transparent border-b border-morandi-border/30 focus:border-morandi-text outline-none text-sm text-morandi-text transition-colors rounded-none" placeholder="用逗号分隔，如：复古, 丝绒, 夏季" />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">价格/租金 / PRICE</label>
        <input v-model="formData.price" type="text" class="w-full px-1 py-3 bg-transparent border-b border-morandi-border/30 focus:border-morandi-text outline-none text-sm text-morandi-text transition-colors rounded-none" placeholder="如: ￥200/天" />
      </div>
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">购买/租赁链接 / PURCHASE LINK</label>
        <input v-model="formData.link" type="text" class="w-full px-1 py-3 bg-transparent border-b border-morandi-border/30 focus:border-morandi-text outline-none text-sm text-morandi-text transition-colors rounded-none" placeholder="淘宝/小红书等来源链接" />
      </div>
    </div>

    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">相册照片 / PHOTOS</label>
      <p class="text-[10px] text-morandi-blue/60 mb-2">上传第一张图片将作为默认封面展示</p>
      <ImageUploader 
        v-model="formData.images" 
        :category="category" 
        :multi="true"
        @mouseenter="onAreaMouseEnter"
        @mouseleave="onAreaMouseLeave"
        ref="imagesUploaderRef"
      />
      <p v-if="formData.images?.length" class="mt-3 text-[10px] text-morandi-muted pointer-events-none uppercase tracking-widest text-center">
        Total {{ formData.images.length }} images · Click or Paste to add more
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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
