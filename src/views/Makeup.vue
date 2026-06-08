<template>
  <div class="h-full overflow-y-auto px-12 py-10 relative select-none font-sans bg-morandi-canvas text-morandi-text">
    <div class="flex flex-col md:flex-row justify-between items-stretch md:items-end gap-6 mb-12 border-b border-morandi-border/20 pb-6">
      <div>
        <h1 class="text-luxury-title-lg text-morandi-text/90 mb-2">眉眼留妆</h1>
        <p class="text-luxury-meta-lg text-morandi-muted">描摹容颜妆色，晕染眉眼情绪</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <!-- 检索过滤面板 -->
        <FilterPanel 
          v-if="makeupStore.makeups.length > 0 && !isManageMode"
          v-model:searchQuery="searchQuery"
          v-model:selectedTags="selectedTags"
          v-model:selectedSort="selectedSort"
          :sortOptions="makeupSortOptions"
          :tags="allTags"
          :show-region="false"
          @reset="resetFilters"
        />

        <!-- 批量管理 -->
        <button 
          v-if="makeupStore.makeups.length > 0 && !isManageMode"
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
          + 新增妆容
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="makeupStore.loading" class="flex justify-center items-center py-20">
      <p class="text-morandi-muted text-sm uppercase tracking-widest">Loading...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="makeupStore.makeups.length === 0" class="flex flex-col items-center justify-center py-32">
      <div class="text-6xl text-morandi-muted/30 mb-8 font-serif">♀</div>
      <p class="text-morandi-muted text-xs uppercase tracking-widest mb-6">尚无妆容数据 / No Makeup Data</p>
      <button 
        @click="openCreateDrawer"
        class="px-8 py-3 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity outline-none font-medium"
      >
        添加第一款妆容
      </button>
    </div>

    <!-- 妆容卡片墙 (拍立得相纸风格，外圈透明，内圈不对称白边框，3:4 比例) -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-8">
      <div 
        v-for="makeup in filteredItems" :key="makeup.id" 
        class="group relative cursor-pointer bg-transparent transition-all duration-500"
        :class="[
          selectedIds.includes(makeup.id) ? 'scale-[1.01] -translate-y-1 z-10' : 'hover:-translate-y-1',
          isManageMode ? 'scale-[0.98]' : ''
        ]"
        @click="handleCardClick(makeup)"
      >
        <!-- 正圆形漂浮复选框 (浮于相纸之上) -->
        <div 
          v-if="isManageMode" 
          class="absolute top-3 left-3 z-20 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200"
          :class="selectedIds.includes(makeup.id)
            ? 'bg-morandi-text scale-105 shadow-md border-transparent'
            : 'border border-black/10 bg-morandi-paper'"
        >
          <svg v-if="selectedIds.includes(makeup.id)" class="w-3 h-3 text-morandi-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <!-- 拍立得相纸主体：内圈白框，四周不对称留白 (p-3 pb-8)，弹性高矮拉满对齐 (h-full flex flex-col) -->
        <div 
          class="bg-morandi-paper p-3 pb-8 transition-all duration-500 rounded-none shadow-[0_4px_16px_rgba(0,0,0,0.01),0_16px_48px_rgba(0,0,0,0.03)] h-full flex flex-col"
          :class="[
            selectedIds.includes(makeup.id)
              ? 'ring-1 ring-morandi-text/20 shadow-xl'
              : 'hover:shadow-md'
          ]"
        >
          <!-- 3:4 比例竖图区 (带微弱描边与内阴影，禁止挤压 shrink-0) -->
          <div class="aspect-[3/4] overflow-hidden bg-morandi-canvas/10 mb-4 border border-morandi-border/10 rounded-sm shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] shrink-0">
            <img v-if="makeup.coverURL" :src="makeup.coverURL" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div v-else class="w-full h-full flex items-center justify-center text-morandi-text/20 bg-gradient-to-br from-morandi-gstart to-morandi-gend text-5xl font-serif">
              {{ makeup.name?.charAt(0) || '?' }}
            </div>
          </div>
 
          <!-- 拍立得相纸底边手写体参数居中排版 (强制贴底对齐 mt-auto) -->
          <div class="text-center px-1 mt-auto">
            <h2 class="font-serif text-sm text-morandi-text font-medium group-hover:text-morandi-red transition-colors duration-300 truncate mb-1">
              {{ makeup.name }}
            </h2>
            <div class="flex justify-center flex-wrap items-center gap-1 mt-2 select-none">
              <template v-for="(tag, idx) in makeup.tags.slice(0, 3)" :key="tag">
                <span v-if="idx > 0" class="text-morandi-muted/40 text-[10px] font-sans">·</span>
                <span class="text-[10px] uppercase tracking-widest text-morandi-muted font-sans font-medium">
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
          <button @click="confirmDelete" class="p-1.5 text-morandi-muted hover:text-red-400 hover:bg-red-50 transition-colors" title="删除妆容">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </template>

      <!-- 浏览模式 -->
      <MakeupView v-if="drawerMode === 'view'" :makeup="currentMakeup" @preview="preview" />

      <!-- 编辑模式 -->
      <MakeupForm v-else-if="drawerMode === 'edit'" :form-data="formData" :category="category" />

      <template #footer v-if="drawerMode === 'view'">
        <div class="text-xs text-morandi-muted text-center w-full pb-2">Makeup Collection</div>
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

    <!-- 新建前命名弹窗 (已抽离为通用组件) -->
    <NamePromptModal
      v-model:show="showNamePrompt"
      v-model:value="promptName"
      title="新建妆容造型"
      sub-title="Create New Makeup"
      label="输入妆容名称"
      placeholder="未命名妆容"
      @confirm="confirmNamePromptWithForm"
      @cancel="cancelNamePrompt"
    />

    <!-- 全屏大图预览 -->
    <transition name="fade">
      <div v-if="previewUrl" class="fixed inset-0 z-[100] backdrop-blur-md bg-white/10 flex justify-center items-center p-12 cursor-zoom-out" @click="closePreview">
        <img :src="previewUrl" loading="lazy" class="max-w-full max-h-full object-contain shadow-[0_30px_100px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300" @click.stop />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { onMounted, reactive, computed } from 'vue'
import ResourceDrawer from '../components/ResourceDrawer.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import NamePromptModal from '../components/common/NamePromptModal.vue'
import MakeupView from '../components/Makeup/MakeupView.vue'
import MakeupForm from '../components/Makeup/MakeupForm.vue'
import FilterPanel from '../components/common/FilterPanel.vue'
import BatchActionBar from '../components/common/BatchActionBar.vue'
import { useMakeupStore } from '../store/makeupStore'
import { useLibraryPage } from '../composables/useLibraryPage'
import { sanitize } from '../utils/helpers'

const makeupStore = useMakeupStore()

const makeupSortOptions = [
  { value: 'recently_added', label: '最近添加' },
  { value: 'name_pinyin', label: '名称排序' }
]

const {
  isDrawerOpen, drawerMode, editingId, tempId, previewUrl, initialFolderName,
  searchQuery, selectedTags, isManageMode, selectedIds, selectedSort,
  isConfirmOpen, confirmMessage, showNamePrompt, promptName,
  resetFilters, handleCardClick, toggleAll, executeBatchDelete, cancelManageMode,
  openCreateDrawer, confirmNamePrompt, cancelNamePrompt, openViewDrawer,
  executeBatchDeleteAction, executeSingleDeleteAction, closeDrawer,
  preview, closePreview,
  allTags, filteredItems, isAllSelected,
} = useLibraryPage({
  store: makeupStore,
  storeItems: () => makeupStore.makeups,
  entityLabel: '妆容',
  sortOptions: makeupSortOptions,
  folderPrefix: 'new_makeup_',
  categoryPath: 'makeup',
  onRefresh: () => refreshImages(),
})

const formData = reactive({
  name: '',
  description: '',
  tagsInput: '',
  images: []
})

const currentMakeup = computed(() => {
  if (!editingId.value) return null
  return makeupStore.makeups.find(m => m.id === editingId.value)
})

const drawerTitle = computed(() => {
  if (drawerMode.value === 'view') return '妆容详情'
  return editingId.value ? '编辑妆容' : '新建妆容'
})

const category = computed(() => `makeup/${(() => {
  if (initialFolderName.value && !initialFolderName.value.startsWith('new_makeup_')) {
    return initialFolderName.value
  }
  const base = editingId.value || tempId.value
  const name = sanitize(formData.name)
  return name === 'unnamed' ? `new_makeup_${base}` : `${name}_${base}`
})()}`)

const refreshImages = async () => {
  await Promise.all(makeupStore.makeups.map(async (item) => {
    if (item.images && item.images.length > 0) {
      const firstImg = item.images[0]
      const path = typeof firstImg === 'string' ? firstImg : (firstImg.path || firstImg.url)
      item.coverURL = await window.electronAPI.imageToURL(path)
    } else {
      item.coverURL = ''
    }
    if (item.images) {
      for (const img of item.images) {
        if (img && typeof img === 'object') {
          img.url = await window.electronAPI.imageToURL(img.path)
        }
      }
    }
  }))
}

onMounted(async () => {
  await makeupStore.fetchAll()
  await refreshImages()
})

const resetForm = () => {
  formData.name = ''
  formData.description = ''
  formData.tagsInput = ''
  formData.images = []
}

const fillFormFromMakeup = async (makeup) => {
  editingId.value = makeup.id
  formData.name = makeup.name || ''
  formData.description = makeup.description || ''
  formData.tagsInput = (makeup.tags || []).join(', ')
  formData.images = JSON.parse(JSON.stringify(makeup.images || []))
}

const confirmNamePromptWithForm = () => {
  confirmNamePrompt(resetForm)
  formData.name = promptName.value.trim()
}

const executeDelete = async () => {
  if (isManageMode.value) {
    await executeBatchDeleteAction()
  } else if (currentMakeup.value) {
    await executeSingleDeleteAction(currentMakeup.value)
  }
}

const switchToEdit = async () => {
  if (currentMakeup.value) {
    await fillFormFromMakeup(currentMakeup.value)
    drawerMode.value = 'edit'
  }
}

const confirmDelete = async () => {
  if (!currentMakeup.value) return
  confirmMessage.value = `确定要从妆容库中删除 "${currentMakeup.value.name}" 吗？此操作不可撤销。`
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
    description: formData.description,
    tags: formData.tagsInput.split(/[,，]/).map(s => s.trim()).filter(Boolean),
    images: formData.images
  }

  if (editingId.value) {
    await makeupStore.update(editingId.value, dataToSave)
  } else {
    const newRecord = await makeupStore.create(dataToSave)
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
