<template>
  <div class="space-y-6 pb-10">
    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">模特姓名 / NAME</label>
      <input v-model="formData.name" type="text" class="w-full px-4 py-3 bg-white border border-black/5 focus:border-morandi-blue outline-none transition-colors" placeholder="输入模特姓名" />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">地区 / REGION</label>
        <input v-model="formData.region" type="text" class="w-full px-4 py-3 bg-white border border-black/5 focus:border-morandi-blue outline-none transition-colors" placeholder="如: 上海" />
      </div>
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">价格 / PRICE</label>
        <input v-model="formData.price" type="text" class="w-full px-4 py-3 bg-white border border-black/5 focus:border-morandi-blue outline-none transition-colors" placeholder="如: 1000" />
      </div>
    </div>
    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">擅长风格 / STYLES</label>
      <input v-model="formData.tagsInput" type="text" class="w-full px-4 py-3 bg-white border border-black/5 focus:border-morandi-blue outline-none transition-colors" placeholder="用逗号分隔，如：高级脸, 法式" />
    </div>
    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">社交账号 / SOCIAL</label>
      <input v-model="formData.social" type="text" class="w-full px-4 py-3 bg-white border border-black/5 focus:border-morandi-blue outline-none transition-colors" placeholder="微博/小红书等" />
    </div>
    
    <!-- 分开的图片上传区 -->
    <div class="grid grid-cols-2 gap-6">
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">模特头像 / AVATAR</label>
        <p class="text-[10px] text-morandi-blue/60 mb-2">上传竖图以获得最佳显示效果</p>
        <ImageUploader 
          v-model="avatarObj" 
          :category="category" 
          placeholder="点击或拖拽上传头像"
          @mouseenter="onAreaMouseEnter('avatar')"
          @mouseleave="onAreaMouseLeave"
          @change="updateAvatar"
          ref="avatarUploaderRef"
        />
      </div>
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">模特卡 / CARD</label>
        <p class="text-[10px] text-morandi-blue/60 mb-2">用于展示模特综合素质的模卡</p>
        <ImageUploader 
          v-model="modelCardObj" 
          :category="category" 
          placeholder="点击或拖拽上传模卡"
          @mouseenter="onAreaMouseEnter('model_card')"
          @mouseleave="onAreaMouseLeave"
          @change="updateModelCard"
          ref="cardUploaderRef"
        />
      </div>
    </div>

    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">作品照片 / PHOTOS</label>
      <ImageUploader 
        v-model="formData.images" 
        :category="category" 
        :multi="true"
        @mouseenter="onAreaMouseEnter('images')"
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

const currentPasteTarget = ref('images')

const avatarUploaderRef = ref(null)
const cardUploaderRef = ref(null)
const imagesUploaderRef = ref(null)

const avatarObj = ref(null)
const modelCardObj = ref(null)

const { activate, deactivate } = usePasteTarget()

const getPasteHandler = () => {
  let uploader = imagesUploaderRef.value
  if (currentPasteTarget.value === 'avatar') uploader = avatarUploaderRef.value
  else if (currentPasteTarget.value === 'model_card') uploader = cardUploaderRef.value
  return uploader
}

const handlePaste = async (e) => {
  const uploader = getPasteHandler()
  if (uploader && uploader.handlePaste) {
    if (uploader.isUploading) return
    const newImages = await uploader.handlePaste(e, props.category)
    if (newImages && newImages.length > 0) {
      uploader.emitChanges(newImages)
    }
  }
}

const onAreaMouseEnter = (target) => {
  currentPasteTarget.value = target
  activate(handlePaste)
}

const onAreaMouseLeave = () => {
  deactivate()
}

// 同步初始值
watch(() => props.formData, (newVal) => {
  if (newVal.avatarPreview) {
    avatarObj.value = { url: newVal.avatarPreview, path: newVal.avatar_path }
  } else {
    avatarObj.value = null
  }
  
  if (newVal.modelCardPreview) {
    modelCardObj.value = { url: newVal.modelCardPreview, path: newVal.model_card_path }
  } else {
    modelCardObj.value = null
  }
}, { immediate: true, deep: true })

const updateAvatar = (val) => {
  if (val) {
    props.formData.avatar_path = val.path
    props.formData.avatarPreview = val.url
  } else {
    props.formData.avatar_path = ''
    props.formData.avatarPreview = ''
  }
}

const updateModelCard = (val) => {
  if (val) {
    props.formData.model_card_path = val.path
    props.formData.modelCardPreview = val.url
  } else {
    props.formData.model_card_path = ''
    props.formData.modelCardPreview = ''
  }
}
</script>
