<template>
  <div class="h-full overflow-y-auto px-12 py-10 relative">
    <div class="flex flex-col md:flex-row justify-between items-stretch md:items-end gap-6 mb-12">
      <div>
        <h1 class="text-luxury-title-lg text-morandi-text/90 mb-2">模特素材库</h1>
        <p class="text-luxury-meta-sm text-morandi-muted">Model Library / Collection</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <!-- 高级检索过滤面板 (同行内联) -->
        <FilterPanel 
          v-if="modelStore.models.length > 0 && !isManageMode"
          v-model:searchQuery="searchQuery"
          v-model:selectedRegion="selectedRegion"
          v-model:selectedTags="selectedTags"
          v-model:selectedSort="selectedSort"
          :sortOptions="modelSortOptions"
          :regions="regions"
          :tags="allTags"
          @reset="resetFilters"
        />

        <!-- 批量管理（仅在非管理模式下显示，管理模式下由悬浮胶囊栏承载退出功能） -->
        <button 
          v-if="modelStore.models.length > 0 && !isManageMode"
          @click="isManageMode = true"
          class="px-6 py-2 text-[11px] uppercase tracking-widest transition-all rounded-full border outline-none font-medium border-morandi-text text-morandi-text hover:bg-morandi-text hover:text-morandi-canvas"
        >
          批量管理
        </button>

        <button 
          v-if="!isManageMode"
          @click="openCreateDrawer"
          class="px-6 py-2 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity font-medium outline-none shadow-sm"
        >
          + 新建模特
        </button>
      </div>
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
        class="px-8 py-3 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity outline-none font-medium"
      >
        添加第一位模特
      </button>
    </div>

    <!-- 模特卡片墙 (拍立得相纸风格，外圈透明，内圈不对称白边框，1:1 比例) -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-8">
      <div 
        v-for="model in filteredModels" :key="model.id" 
        class="group relative cursor-pointer bg-transparent transition-all duration-500"
        :class="[
          selectedIds.includes(model.id) ? 'scale-[1.01] -translate-y-1 z-10' : 'hover:-translate-y-1',
          isManageMode ? 'scale-[0.98]' : ''
        ]"
        @click="handleCardClick(model)"
      >
        <!-- 精致圆形漂浮复选框 (浮于相纸之上) -->
        <div 
          v-if="isManageMode" 
          class="absolute top-3 left-3 z-20 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200"
          :class="selectedIds.includes(model.id)
            ? 'bg-morandi-text scale-105 shadow-md border-transparent'
            : 'border border-black/10 bg-morandi-paper'"
        >
          <svg v-if="selectedIds.includes(model.id)" class="w-3 h-3 text-morandi-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <!-- 拍立得相纸主体：内圈白框，四周不对称留白 (p-3 pb-8)，弹性高矮拉满对齐 (h-full flex flex-col) -->
        <div 
          class="bg-morandi-paper p-3 pb-8 transition-all duration-500 rounded-none shadow-[0_4px_16px_rgba(0,0,0,0.01),0_16px_48px_rgba(0,0,0,0.03)] h-full flex flex-col"
          :class="[
            selectedIds.includes(model.id)
              ? 'ring-1 ring-morandi-text/20 shadow-xl'
              : 'hover:shadow-md'
          ]"
        >
          <!-- 1:1 照片底片区 (带微弱描边，禁止挤压 shrink-0) -->
          <div class="aspect-square overflow-hidden bg-morandi-canvas/10 mb-4 border border-morandi-border/10 rounded-sm shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] shrink-0">
            <img v-if="model.avatarURL" :src="model.avatarURL" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div v-else class="w-full h-full flex items-center justify-center text-morandi-text/20 bg-gradient-to-br from-morandi-gstart to-morandi-gend text-5xl font-serif">
              {{ model.name?.charAt(0) || '?' }}
            </div>
          </div>
          
          <!-- 拍立得相纸底边居中参数 (强制贴底对齐 mt-auto) -->
          <div class="text-center mt-auto select-none">
            <h2 class="text-luxury-body font-sans text-morandi-text mb-1 font-medium group-hover:text-morandi-red transition-colors">{{ model.name }}</h2>
            <div class="flex justify-center flex-wrap items-center gap-1.5 mt-3">
              <template v-for="(tag, idx) in model.tags" :key="tag">
                <span v-if="idx > 0" class="text-morandi-muted/40 text-[9px] font-sans">·</span>
                <span class="text-luxury-meta-sm text-morandi-muted font-sans">
                  {{ tag }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部批量管理悬浮操作栏 -->
    <BatchActionBar 
      :show="isManageMode"
      :selected-count="selectedIds.length"
      :is-all-selected="isAllSelected"
      @toggle-all="toggleAll"
      @cancel="cancelManageMode"
      @delete="executeBatchDelete"
    />

    <!-- 抽屉组件 -->
    <ResourceDrawer 
      :is-open="isDrawerOpen" 
      :title="drawerTitle" 
      width="w-[500px]" 
      :show-footer="drawerMode !== 'view'"
      :close-on-click-outside="drawerMode !== 'edit'"
      @close="handleCloseDrawer" 
      @save="handleSave"
    >
      <template #header-actions v-if="drawerMode === 'view'">
        <div class="flex items-center gap-3">
          <button @click="switchToEdit" class="rounded-full px-4 py-1.5 border border-morandi-border hover:bg-morandi-text hover:text-morandi-paper transition-colors text-[10px] tracking-widest font-sans">
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
      <ModelView v-if="drawerMode === 'view'" :model="currentModel" @preview="preview" />

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
        <div class="bg-morandi-paper p-8 shadow-2xl w-[400px] border border-morandi-border rounded-none">
          <h3 class="text-luxury-title-md text-morandi-text mb-2">新建模特</h3>
          <p class="text-luxury-meta-sm text-morandi-muted mb-6">Create New Model</p>
          <div class="mb-8">
            <label class="block text-luxury-meta-sm text-morandi-muted mb-2">输入模特姓名</label>
            <input 
              v-model="promptName" 
              type="text" 
              class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-sm text-morandi-text rounded-none" 
              placeholder="必填..."
              @keyup.enter="confirmNamePromptWithForm"
            />
          </div>
          <div class="flex justify-end gap-3">
            <button @click="cancelNamePrompt" class="px-6 py-2 text-[11px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors font-medium outline-none">
              取消 / Cancel
            </button>
            <button 
              @click="confirmNamePromptWithForm" 
              class="px-6 py-2 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 font-medium outline-none"
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
        <img :src="previewUrl" loading="lazy" class="max-w-full max-h-full object-contain shadow-[0_30px_100px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300" @click.stop />
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
import FilterPanel from '../components/common/FilterPanel.vue'
import BatchActionBar from '../components/common/BatchActionBar.vue'
import { useModelStore } from '../store/modelStore'
import { useLibraryPage } from '../composables/useLibraryPage'
import { sanitize } from '../utils/helpers'

const modelStore = useModelStore()

const selectedRegion = ref('')

const modelSortOptions = [
  { value: 'recently_added', label: '最近添加' },
  { value: 'name_pinyin', label: '姓名排序' },
  { value: 'price_asc', label: '价格升序' },
  { value: 'price_desc', label: '价格降序' }
]

const regions = computed(() => {
  const all = modelStore.models.map(m => m.region).filter(Boolean)
  return [...new Set(all)]
})

const {
  isDrawerOpen, drawerMode, editingId, tempId, previewUrl, initialFolderName,
  searchQuery, selectedTags, isManageMode, selectedIds, selectedSort,
  allTags, filteredItems: baseFiltered, isAllSelected,
  isConfirmOpen, confirmMessage, showNamePrompt, promptName,
  resetFilters: baseResetFilters, handleCardClick, toggleAll, executeBatchDelete, cancelManageMode,
  openCreateDrawer, confirmNamePrompt, cancelNamePrompt, openViewDrawer,
  executeBatchDeleteAction, executeSingleDeleteAction, closeDrawer,
  preview, closePreview,
} = useLibraryPage({
  store: modelStore,
  storeItems: () => modelStore.models,
  entityLabel: '模特',
  sortOptions: modelSortOptions,
  folderPrefix: 'new_model_',
  categoryPath: 'models',
  onRefresh: () => refreshImages(),
})

const filteredModels = computed(() => {
  return baseFiltered.value.filter(m => {
    if (!searchQuery.value.trim()) {
      const matchesRegion = !selectedRegion.value || m.region === selectedRegion.value
      return matchesRegion
    }
    const matchesRegion = !selectedRegion.value || m.region === selectedRegion.value
    return matchesRegion
  })
})

const resetFilters = () => {
  baseResetFilters()
  selectedRegion.value = ''
}

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

const currentModel = computed(() => {
  if (!editingId.value) return null
  return modelStore.models.find(m => m.id === editingId.value)
})

const drawerTitle = computed(() => {
  if (drawerMode.value === 'view') return '模特资料'
  return editingId.value ? '编辑模特' : '新建模特'
})

const category = computed(() => {
  if (initialFolderName.value && !initialFolderName.value.startsWith('new_model_')) {
    return `models/${initialFolderName.value}`
  }
  const base = editingId.value || tempId.value
  const name = sanitize(formData.name)
  const folder = name === 'unnamed' ? `new_model_${base}` : `${name}_${base}`
  initialFolderName.value = folder
  return `models/${folder}`
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

const confirmNamePromptWithForm = () => {
  confirmNamePrompt(resetForm)
  formData.name = promptName.value.trim()
}

const executeDelete = async () => {
  if (isManageMode.value) {
    await executeBatchDeleteAction()
  } else if (currentModel.value) {
    await executeSingleDeleteAction(currentModel.value)
  }
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

const handleCloseDrawer = () => {
  closeDrawer()
}

const handleSave = async () => {
  if (drawerMode.value === 'view') {
    handleCloseDrawer()
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
