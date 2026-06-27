<template>
  <div>
    <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">主题名称 / THEME TITLE</label>
    <input v-model="formData.title" type="text" class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-sm text-morandi-text mb-4 rounded-none" />
    
    <div class="flex items-center justify-between gap-3 mb-2">
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted font-bold">描述说明 / DESCRIPTION</label>
      <button
        type="button"
        @click="generateCopy"
        :disabled="isGenerating"
        class="shrink-0 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none font-medium"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3l1.7 5.2L19 10l-5.3 1.8L12 17l-1.7-5.2L5 10l5.3-1.8L12 3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
          <path d="M18.5 15l.8 2.4 2.2.8-2.2.8-.8 2.4-.8-2.4-2.2-.8 2.2-.8.8-2.4z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
        </svg>
        <span>{{ isGenerating ? '生成中...' : 'AI 创意' }}</span>
      </button>
    </div>
    <textarea v-model="formData.description" rows="3" class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-sm text-morandi-text mb-3 rounded-none resize-none"></textarea>
    <div v-if="aiError" class="mb-6 bg-transparent text-morandi-text text-[10px] p-3 border border-morandi-border animate-fade-in flex items-center font-sans">
      <span class="mr-2 text-morandi-red">!</span>
      {{ aiError }}
    </div>
    <div v-else class="mb-6"></div>
    
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
import { createThemeCopyPayload } from '../../../utils/aiPayload'

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
const isGenerating = ref(false)
const aiError = ref('')
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

const generateCopy = async () => {
  if (isGenerating.value) return

  isGenerating.value = true
  aiError.value = ''

  try {
    if (!window.electronAPI?.ai?.generateThemeCopy) {
      throw new Error('未检测到 AI 创意接口')
    }

    const result = await window.electronAPI.ai.generateThemeCopy(createThemeCopyPayload(props.formData))

    if (!result?.text) {
      throw new Error('AI 未返回可用文案')
    }

    props.formData.description = result.text
  } catch (err) {
    aiError.value = err.message || 'AI 创意生成失败，请检查全局设置中的模型与 API Key。'
  } finally {
    isGenerating.value = false
  }
}
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
