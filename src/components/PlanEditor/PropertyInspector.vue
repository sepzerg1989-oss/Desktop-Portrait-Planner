<template>
  <div 
    class="h-full w-full bg-white border-l border-black/5 flex flex-col relative outline-none" 
    tabindex="0"
    @click="($event.target.tagName !== 'INPUT' && $event.target.tagName !== 'TEXTAREA' && $event.target.tagName !== 'BUTTON' && $event.target.tagName !== 'SELECT') && $event.currentTarget.focus()"
  >
    <div class="p-6 border-b border-black/5">
      <div>
        <h2 class="font-serif text-xl text-morandi-text/90 tracking-[0.1em]">
          属性编辑 <span class="text-[10px] font-sans text-morandi-muted uppercase tracking-[0.3em] ml-2 font-normal">/ PROPERTIES</span>
        </h2>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <div v-if="activeModule" class="space-y-6">
        
        <ThemeInspector 
          v-if="activeModule.type === 'theme'" 
          :form-data="formData" 
          :category="category" 
        />
        
        <ModelInspector 
          v-else-if="activeModule.type === 'model'" 
          :form-data="formData" 
          :category="category" 
          @toggle-library="toggleModelLibrary"
          @save-library="saveToLibrary"
        />

        <LocationInspector 
          v-else-if="activeModule.type === 'location'" 
          :form-data="formData" 
          :category="category" 
          @toggle-library="toggleLocationLibrary"
          @save-library="saveLocationToLibrary"
        />

        <TimeInspector 
          v-else-if="activeModule.type === 'shoot_time'" 
          :form-data="formData" 
        />

        <GenericInspector 
          v-else 
          :form-data="formData" 
          :category="category" 
          :module-type="activeModule.type"
          :module-title="activeModule.title"
          @update:title="store.updateModuleTitle(activeModule.id, $event)"
        />

      </div>
      <div v-else class="text-center text-morandi-muted text-sm mt-10">
        请在左侧选择一个模块进行编辑
      </div>
    </div>

    <!-- 模特库选择弹窗 -->
    <ModelLibraryModal 
      :show="showModelLibrary" 
      @close="showModelLibrary = false" 
      @import="importModel" 
    />
    
    <!-- 场地库选择弹窗 -->
    <LocationLibraryModal 
      :show="showLocationLibrary" 
      @close="showLocationLibrary = false" 
      @import="importLocation" 
    />
    <!-- 快捷命名弹窗 (针对存入素材库) -->
    <transition name="fade">
      <div v-if="promptModal.isOpen" class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white p-8 shadow-2xl w-[400px]">
          <h3 class="text-xl font-serif text-morandi-text mb-2">{{ promptModal.title }}</h3>
          <p class="text-[10px] uppercase tracking-widest text-morandi-muted mb-6">Quick Save</p>
          <div class="mb-8">
            <label class="block text-xs uppercase tracking-wider text-morandi-muted mb-2">{{ promptModal.label }}</label>
            <input 
              v-model="promptModal.value" 
              type="text" 
              class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30" 
              placeholder="必填..."
              @keyup.enter="confirmPrompt"
              autofocus
            />
          </div>
          <div class="flex justify-end gap-3">
            <button @click="cancelPrompt" class="px-6 py-2 text-xs uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors">
              取消 / Cancel
            </button>
            <button 
              @click="confirmPrompt" 
              class="px-6 py-2 bg-morandi-text text-white text-xs uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-50"
              :disabled="!promptModal.value.trim()"
            >
              确认 / Confirm
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { usePlanStore } from '../../store/planStore'
import { useModelStore } from '../../store/modelStore'
import { useLocationStore } from '../../store/locationStore'

import ThemeInspector from './Inspectors/ThemeInspector.vue'
import ModelInspector from './Inspectors/ModelInspector.vue'
import LocationInspector from './Inspectors/LocationInspector.vue'
import TimeInspector from './Inspectors/TimeInspector.vue'
import GenericInspector from './Inspectors/GenericInspector.vue'
import ModelLibraryModal from './ModelLibraryModal.vue'
import LocationLibraryModal from './LocationLibraryModal.vue'

const emit = defineEmits(['notify'])

const store = usePlanStore()
const modelStore = useModelStore()
const locationStore = useLocationStore()

const activeModule = computed(() => store.activeModule)

const showModelLibrary = ref(false)
const showLocationLibrary = ref(false)

const sanitize = (name) => {
  return (name || '').replace(/[\\\/:\*\?"<>\|]/g, '_').trim() || 'unnamed'
}

// 图片存放目录
const category = computed(() => `plans/${sanitize(store.planTitle)}_${store.planId}`)

// 双向绑定表单数据
const formData = ref({})

// 当选中不同模块时，重置表单数据
watch(activeModule, (newVal, oldVal) => {
  if (newVal?.id === oldVal?.id && oldVal !== undefined) return

  // 核心修复：一旦切换模块，立即关闭所有仍处于开启状态的素材库选择弹窗，杜绝数据越界错位注入
  showModelLibrary.value = false
  showLocationLibrary.value = false

  if (newVal) {
    formData.value = JSON.parse(JSON.stringify(newVal.data)) // 使用深拷贝防止引用干扰
    if (newVal.type === 'model' && newVal.data.tags) {
      formData.value.tagsInput = (newVal.data.tags || []).join(', ')
    } else if (newVal.type === 'location' && newVal.data.tags) {
      formData.value.tagsInput = (newVal.data.tags || []).join(', ')
    }
  } else {
    formData.value = {}
  }
}, { immediate: true })

// 监听外部对当前模块图片数组的直接修改（例如在 Canvas 上拖拽排序或删除），同步到表单中
watch(() => activeModule.value?.data?.images, (newImages) => {
  if (newImages && formData.value && formData.value.images) {
    const currentStr = JSON.stringify(formData.value.images)
    const newStr = JSON.stringify(newImages)
    if (currentStr !== newStr) {
      formData.value.images = JSON.parse(newStr)
    }
  }
}, { deep: true })

// 当表单数据改变时，同步回 Store (实现双向绑定)
watch(formData, (newVal) => {
  if (Object.keys(newVal).length > 0) {
    const updatedData = { ...newVal }
    if (updatedData.tagsInput !== undefined) {
      updatedData.tags = updatedData.tagsInput.split(/[,，]/).map(s => s.trim()).filter(Boolean)
    }
    store.updateActiveModuleData(updatedData)
  }
}, { deep: true })

// ==================== 模特库联动 ====================
const toggleModelLibrary = async () => {
  if (!showModelLibrary.value) {
    await modelStore.fetchAll()
    for (const m of modelStore.models) {
      if (m.avatar_path && !m.avatarURL) m.avatarURL = await window.electronAPI.imageToURL(m.avatar_path)
      if (m.model_card_path && !m.modelCardURL) m.modelCardURL = await window.electronAPI.imageToURL(m.model_card_path)
    }
  }
  showModelLibrary.value = !showModelLibrary.value
}

const importModel = async (model) => {
  formData.value = {
    name: model.name,
    region: model.region,
    price: model.price,
    tags: [...(model.tags || [])],
    tagsInput: (model.tags || []).join(', '),
    avatar: model.avatarURL || '',
    avatarPath: model.avatar_path || '',
    modelCard: model.modelCardURL || '',
    modelCardPath: model.model_card_path || '',
    images: JSON.parse(JSON.stringify(model.images || []))
  }
  showModelLibrary.value = false
}

const saveToLibrary = async () => {
  if (!formData.value.name) {
    showSavePrompt('model')
    return
  }
  
  const tags = formData.value.tagsInput 
    ? formData.value.tagsInput.split(/[,，]/).map(s => s.trim()).filter(Boolean)
    : (formData.value.tags || [])

  const dataToSave = {
    name: formData.value.name,
    region: formData.value.region || '',
    price: formData.value.price || '',
    tags: tags,
    social: '',
    avatar_path: formData.value.avatarPath || '',
    model_card_path: formData.value.modelCardPath || '',
    images: formData.value.images || []
  }

  await modelStore.create(dataToSave)
  emit('notify', { title: '操作成功', message: '已成功存入模特库', type: 'alert' })
}

// ==================== 场地库联动 ====================
const toggleLocationLibrary = async () => {
  if (!showLocationLibrary.value) {
    await locationStore.fetchAll()
    for (const loc of locationStore.locations) {
      if (loc.cover_path && !loc.coverURL) {
        loc.coverURL = await window.electronAPI.imageToURL(loc.cover_path)
      }
      if (!loc.coverURL && loc.images?.length > 0) {
        loc.coverURL = await window.electronAPI.imageToURL(loc.images[0].url || loc.images[0])
      }
    }
  }
  showLocationLibrary.value = !showLocationLibrary.value
}

const importLocation = async (loc) => {
  const processedImages = []
  if (loc.images) {
    for (let img of loc.images) {
      const url = typeof img === 'string' ? img : (img.url || img.path)
      if (url && url.startsWith('local-image://')) {
        processedImages.push(img)
      } else if (url) {
        const atomUrl = await window.electronAPI.imageToURL(url)
        processedImages.push({ url: atomUrl, path: url, ratio: img.ratio || 1 })
      }
    }
  }

  formData.value = {
    name: loc.name,
    address: loc.address,
    tags: [...(loc.tags || [])],
    tagsInput: (loc.tags || []).join(', '),
    images: processedImages
  }
  showLocationLibrary.value = false
}

const saveLocationToLibrary = async () => {
  if (!formData.value.name) {
    showSavePrompt('location')
    return
  }

  const tags = formData.value.tagsInput 
    ? formData.value.tagsInput.split(/[,，]/).map(s => s.trim()).filter(Boolean)
    : (formData.value.tags || [])

  const dataToSave = {
    name: formData.value.name,
    address: formData.value.address || '',
    tags: tags,
    images: formData.value.images || []
  }

  await locationStore.create(dataToSave)
  emit('notify', { title: '操作成功', message: '已成功存入场地库', type: 'alert' })
}

// ==================== 快捷命名弹窗 ====================
const promptModal = ref({
  isOpen: false,
  title: '',
  label: '',
  value: '',
  type: '' // 'model' or 'location'
})

const showSavePrompt = (type) => {
  promptModal.value = {
    isOpen: true,
    title: type === 'model' ? '保存模特到素材库' : '保存场地到素材库',
    label: type === 'model' ? '请输入模特姓名' : '请输入场地名称',
    value: '',
    type: type
  }
}

const cancelPrompt = () => {
  promptModal.value.isOpen = false
}

const confirmPrompt = async () => {
  if (!promptModal.value.value.trim()) return
  
  formData.value.name = promptModal.value.value.trim()
  promptModal.value.isOpen = false
  
  // 继续执行保存
  if (promptModal.value.type === 'model') {
    await saveToLibrary()
  } else if (promptModal.value.type === 'location') {
    await saveLocationToLibrary()
  }
}
</script>
