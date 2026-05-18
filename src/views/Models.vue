<template>
  <div class="h-full overflow-y-auto px-12 py-10 relative">
    <div class="flex justify-between items-end mb-12">
      <div>
        <h1 class="text-4xl font-serif text-morandi-text/90 mb-2 tracking-[0.1em]">模特素材库</h1>
        <p class="text-morandi-muted text-[10px] tracking-[0.3em] uppercase">Model Library / Collection</p>
      </div>
      <button 
        @click="openCreateDrawer"
        class="px-6 py-2 border border-morandi-text text-morandi-text text-sm uppercase tracking-wider hover:bg-morandi-text hover:text-white transition-colors"
      >
        + 新建模特
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="modelStore.loading" class="flex justify-center items-center py-20">
      <p class="text-morandi-muted text-sm uppercase tracking-widest">Loading...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="modelStore.models.length === 0" class="flex flex-col items-center justify-center py-32">
      <div class="text-6xl text-morandi-muted/30 mb-8 font-serif">♀</div>
      <p class="text-morandi-muted text-xs uppercase tracking-widest mb-6">尚无模特数据 / No Model Data</p>
      <button 
        @click="openCreateDrawer"
        class="px-8 py-3 bg-morandi-text text-white text-sm uppercase tracking-wider hover:bg-black/80 transition-colors"
      >
        添加第一位模特
      </button>
    </div>

    <!-- 模特卡片墙 -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-8">
      <div 
        v-for="model in modelStore.models" :key="model.id" 
        class="group cursor-pointer bg-white border border-black/5 p-4 hover:shadow-xl transition-all duration-300"
        @click="openViewDrawer(model)"
      >
        <div class="aspect-square overflow-hidden bg-black/5 mb-4">
          <img v-if="model.avatarURL" :src="model.avatarURL" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div v-else class="w-full h-full flex items-center justify-center text-morandi-muted/30 text-5xl font-serif">
            {{ model.name?.charAt(0) || '?' }}
          </div>
        </div>
        <h2 class="font-serif text-xl text-morandi-text text-center mb-1">{{ model.name }}</h2>
        <div class="flex justify-center flex-wrap gap-2 mt-3">
          <span v-for="tag in model.tags" :key="tag" class="px-2 py-1 text-[10px] uppercase tracking-wider bg-morandi-canvas text-morandi-text">
            {{ tag }}
          </span>
        </div>
      </div>
    </div>

    <!-- 抽屉组件 -->
    <ResourceDrawer 
      :is-open="isDrawerOpen" 
      :title="drawerTitle" 
      width="w-[500px]" 
      :show-footer="drawerMode !== 'view'"
      :close-on-click-outside="drawerMode !== 'edit'"
      @close="closeDrawer" 
      @save="handleSave"
    >
      <template #header-actions v-if="drawerMode === 'view'">
        <div class="flex items-center gap-3">
          <button @click="switchToEdit" class="px-4 py-1.5 text-xs uppercase tracking-widest border border-morandi-text text-morandi-text hover:bg-morandi-text hover:text-white transition-colors">
            编辑 Edit
          </button>
          <button @click="confirmDelete" class="p-1.5 text-morandi-muted hover:text-red-400 hover:bg-red-50 transition-colors" title="删除模特">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </template>

      <!-- 浏览模式 -->
      <ModelView v-if="drawerMode === 'view'" :model="currentModel" @preview="previewImage" />

      <!-- 编辑模式 -->
      <ModelForm v-else-if="drawerMode === 'edit'" :form-data="formData" :category="category" />

      <template #footer v-if="drawerMode === 'view'">
        <div class="text-xs text-morandi-muted text-center w-full pb-2">Models Library</div>
      </template>
    </ResourceDrawer>

    <!-- 自定义确认弹窗 -->
    <ConfirmModal 
      :is-open="isConfirmOpen"
      title="删除确认"
      :message="confirmMessage"
      @confirm="executeDelete"
      @cancel="isConfirmOpen = false"
    />

    <!-- 新建前命名弹窗 -->
    <transition name="fade">
      <div v-if="showNamePrompt" class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white p-8 shadow-2xl w-[400px]">
          <h3 class="text-xl font-serif text-morandi-text mb-2">新建模特</h3>
          <p class="text-[10px] uppercase tracking-widest text-morandi-muted mb-6">Create New Model</p>
          <div class="mb-8">
            <label class="block text-xs uppercase tracking-wider text-morandi-muted mb-2">输入模特姓名</label>
            <input 
              v-model="promptName" 
              type="text" 
              class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30" 
              placeholder="必填..."
              @keyup.enter="confirmNamePrompt"
            />
          </div>
          <div class="flex justify-end gap-3">
            <button @click="cancelNamePrompt" class="px-6 py-2 text-xs uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors">
              取消 / Cancel
            </button>
            <button 
              @click="confirmNamePrompt" 
              class="px-6 py-2 bg-morandi-text text-white text-xs uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-50"
              :disabled="!promptName.trim()"
            >
              确认 / Confirm
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 全屏大图预览 -->
    <transition name="fade">
      <div v-if="previewUrl" class="fixed inset-0 z-[100] backdrop-blur-md bg-white/10 flex justify-center items-center p-12 cursor-zoom-out" @click="closePreview">
        <img :src="previewUrl" class="max-w-full max-h-full object-contain shadow-[0_30px_100px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300" @click.stop />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import ResourceDrawer from '../components/ResourceDrawer.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import ModelView from '../components/Models/ModelView.vue'
import ModelForm from '../components/Models/ModelForm.vue'
import { useModelStore } from '../store/modelStore'

const modelStore = useModelStore()
const isDrawerOpen = ref(false)
const drawerMode = ref('view') // 'view' or 'edit'
const editingId = ref(null)
const tempId = ref(null) // 用于暂存未保存模特的文件目录 ID
const initialFolderName = ref('') // 会话开始时的文件夹名称
const previewUrl = ref(null)

const sanitize = (name) => {
  return (name || '').replace(/[\\\/:\*\?"<>\|]/g, '_').trim() || 'unnamed'
}

const getFolderName = () => {
  if (initialFolderName.value && !initialFolderName.value.startsWith('new_model_')) {
    return initialFolderName.value
  }
  const base = editingId.value || tempId.value
  const name = sanitize(formData.name)
  const newName = name === 'unnamed' ? `new_model_${base}` : `${name}_${base}`
  initialFolderName.value = newName
  return newName
}

const category = computed(() => `models/${getFolderName()}`)

// 弹窗状态
const isConfirmOpen = ref(false)
const confirmMessage = ref('')
const showNamePrompt = ref(false)
const promptName = ref('')

const currentModel = computed(() => {
  if (!editingId.value) return null
  return modelStore.models.find(m => m.id === editingId.value)
})

const drawerTitle = computed(() => {
  if (drawerMode.value === 'view') return '模特资料'
  return editingId.value ? '编辑模特' : '新建模特'
})

const formData = reactive({
  name: '',
  region: '',
  price: '',
  tagsInput: '',
  social: '',
  avatar_path: '',
  avatarPreview: '',
  model_card_path: '',
  modelCardPreview: '',
  images: []
})

const refreshImages = async () => {
  await Promise.all(modelStore.models.map(async (model) => {
    if (model.avatar_path) {
      model.avatarURL = await window.electronAPI.imageToURL(model.avatar_path)
    }
    if (model.model_card_path) {
      model.modelCardURL = await window.electronAPI.imageToURL(model.model_card_path)
    }
  }))
}

onMounted(async () => {
  await modelStore.fetchAll()
  await refreshImages()
})

const resetForm = () => {
  formData.name = ''
  formData.region = ''
  formData.price = ''
  formData.tagsInput = ''
  formData.social = ''
  formData.avatar_path = ''
  formData.avatarPreview = ''
  formData.model_card_path = ''
  formData.modelCardPreview = ''
  formData.images = []
}

const fillFormFromModel = async (model) => {
  editingId.value = model.id
  formData.name = model.name || ''
  formData.region = model.region || ''
  formData.price = model.price || ''
  formData.tagsInput = (model.tags || []).join(', ')
  formData.social = model.social || ''
  formData.avatar_path = model.avatar_path || ''
  formData.avatarPreview = model.avatar_path ? await window.electronAPI.imageToURL(model.avatar_path) : ''
  formData.model_card_path = model.model_card_path || ''
  formData.modelCardPreview = model.model_card_path ? await window.electronAPI.imageToURL(model.model_card_path) : ''
  formData.images = JSON.parse(JSON.stringify(model.images || []))
}

const openCreateDrawer = () => {
  promptName.value = ''
  showNamePrompt.value = true
}

const confirmNamePrompt = () => {
  if (!promptName.value.trim()) return
  drawerMode.value = 'edit'
  editingId.value = null
  tempId.value = Date.now()
  initialFolderName.value = `${sanitize(promptName.value)}_${tempId.value}`
  resetForm()
  formData.name = promptName.value.trim()
  showNamePrompt.value = false
  isDrawerOpen.value = true
}

const cancelNamePrompt = () => {
  showNamePrompt.value = false
}

const openViewDrawer = async (model) => {
  editingId.value = model.id
  initialFolderName.value = `${sanitize(model.name)}_${model.id}`
  drawerMode.value = 'view'
  isDrawerOpen.value = true
}

const switchToEdit = async () => {
  if (currentModel.value) {
    await fillFormFromModel(currentModel.value)
    drawerMode.value = 'edit'
  }
}

const confirmDelete = async () => {
  if (!currentModel.value) return
  confirmMessage.value = `确定要从模特库中删除 "${currentModel.value.name}" 吗？此操作不可撤销。`
  isConfirmOpen.value = true
}

const executeDelete = async () => {
  if (currentModel.value) {
    await modelStore.remove(currentModel.value.id)
    await refreshImages()
    isConfirmOpen.value = false
    isDrawerOpen.value = false
  }
}

const closeDrawer = async () => {
  if (drawerMode.value === 'edit' && !editingId.value && tempId.value) {
    await window.electronAPI.cleanupTempFolder(`models/${initialFolderName.value}`)
  }
  isDrawerOpen.value = false
}

const previewImage = (url) => {
  previewUrl.value = url
}

const closePreview = () => {
  previewUrl.value = null
}

const handleSave = async () => {
  if (drawerMode.value === 'view') {
    closeDrawer()
    return
  }

  if (!formData.name) return
  
  const dataToSave = {
    name: formData.name,
    region: formData.region,
    price: formData.price,
    tags: formData.tagsInput.split(/[,，]/).map(s => s.trim()).filter(Boolean),
    social: formData.social,
    avatar_path: formData.avatar_path,
    model_card_path: formData.model_card_path,
    images: formData.images
  }

  if (editingId.value) {
    await modelStore.update(editingId.value, dataToSave)
  } else {
    const newRecord = await modelStore.create(dataToSave)
    editingId.value = newRecord.id
  }
  
  await refreshImages()
  drawerMode.value = 'view'
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
