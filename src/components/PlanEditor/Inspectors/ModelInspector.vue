<template>
  <div>
    <div class="flex gap-2 mb-6">
      <button 
        @click="$emit('toggle-library')"
        class="flex-1 py-3 bg-morandi-text text-white text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors"
      >
        从素材库导入
      </button>
      <button 
        @click="$emit('save-library')"
        class="px-4 py-3 border border-morandi-text text-morandi-text text-[10px] uppercase tracking-widest hover:bg-morandi-text hover:text-white transition-colors"
        title="同步到全局模特库"
      >
        存入素材库
      </button>
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">模特姓名 / NAME</label>
        <input v-model="formData.name" type="text" class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">地区 / REGION</label>
          <input v-model="formData.region" type="text" class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30" />
        </div>
        <div>
          <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">价格 / PRICE</label>
          <input v-model="formData.price" type="text" class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">头像 / AVATAR</label>
          <ImageUploader 
            v-model="avatarObj" 
            :category="category" 
            placeholder="头像上传"
            heightClass="h-32"
            @change="updateAvatar"
            @mouseenter="onAreaMouseEnter('avatar')"
            @mouseleave="onAreaMouseLeave"
            ref="avatarUploaderRef"
          />
        </div>
        <div>
          <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">模特卡 / CARD</label>
          <ImageUploader 
            v-model="modelCardObj" 
            :category="category" 
            placeholder="模卡上传"
            heightClass="h-32"
            @change="updateModelCard"
            @mouseenter="onAreaMouseEnter('modelCard')"
            @mouseleave="onAreaMouseLeave"
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
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

const avatarObj = ref(null)
const modelCardObj = ref(null)
const currentPasteTarget = ref('images')

const avatarUploaderRef = ref(null)
const cardUploaderRef = ref(null)
const imagesUploaderRef = ref(null)

const { activate, deactivate } = usePasteTarget()

const getPasteHandler = () => {
  let uploader = imagesUploaderRef.value
  if (currentPasteTarget.value === 'avatar') uploader = avatarUploaderRef.value
  else if (currentPasteTarget.value === 'modelCard') uploader = cardUploaderRef.value
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
  if (newVal.avatar) {
    avatarObj.value = { url: newVal.avatar, path: newVal.avatarPath }
  } else {
    avatarObj.value = null
  }
  
  if (newVal.modelCard) {
    modelCardObj.value = { url: newVal.modelCard, path: newVal.modelCardPath }
  } else {
    modelCardObj.value = null
  }
}, { immediate: true, deep: true })

const updateAvatar = (val) => {
  if (val) {
    props.formData.avatarPath = val.path
    props.formData.avatar = val.url
  } else {
    props.formData.avatarPath = ''
    props.formData.avatar = ''
  }
}

const updateModelCard = (val) => {
  if (val) {
    props.formData.modelCardPath = val.path
    props.formData.modelCard = val.url
  } else {
    props.formData.modelCardPath = ''
    props.formData.modelCard = ''
  }
}
</script>
