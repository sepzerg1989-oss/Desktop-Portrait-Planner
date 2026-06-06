<template>
  <div class="h-full overflow-y-auto px-12 py-10 relative scroll-thin">
    <div class="flex flex-col md:flex-row justify-between items-stretch md:items-end gap-6 mb-12">
      <div>
        <h1 class="text-luxury-title-lg text-morandi-text/90 mb-2">拍摄场地库</h1>
        <p class="text-luxury-meta-sm text-morandi-muted">Location Library / Venues</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <!-- 高级检索过滤面板 (同行内联) -->
        <FilterPanel 
          v-if="locationStore.locations.length > 0 && !isManageMode"
          v-model:searchQuery="searchQuery"
          v-model:selectedRegion="selectedRegion"
          v-model:selectedTags="selectedTags"
          v-model:selectedSort="selectedSort"
          :sortOptions="locationSortOptions"
          :regions="regions"
          :tags="allTags"
          @reset="resetFilters"
        />

        <!-- 批量管理（仅在非管理模式下显示，管理模式下由悬浮胶囊栏承载退出功能） -->
        <button 
          v-if="locationStore.locations.length > 0 && !isManageMode"
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
          + 新建场地
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="locationStore.loading" class="flex justify-center items-center py-20">
      <p class="text-morandi-muted text-sm uppercase tracking-widest animate-pulse">Loading...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="locationStore.locations.length === 0" class="flex flex-col items-center justify-center py-32">
      <div class="text-6xl text-morandi-muted/30 mb-8 font-serif">⌂</div>
      <p class="text-morandi-muted text-xs uppercase tracking-widest mb-6">尚无场地数据 / No Location Data</p>
      <button 
        @click="openCreateDrawer"
        class="px-8 py-3 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity outline-none font-medium"
      >
        添加第一个场地
      </button>
    </div>

    <!-- 场地卡片墙 (宽幅拍立得 Instax WIDE 不对称相纸风格，3:2 比例) -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-8">
      <div 
        v-for="loc in filteredLocations" :key="loc.id" 
        class="group relative cursor-pointer bg-transparent transition-all duration-500"
        :class="[
          selectedIds.includes(loc.id) ? 'scale-[1.01] -translate-y-1 z-10' : 'hover:-translate-y-1',
          isManageMode ? 'scale-[0.98]' : ''
        ]"
        @click="handleCardClick(loc)"
      >
        <!-- 精致圆形漂浮复选框 (浮于相纸之上) -->
        <div 
          v-if="isManageMode" 
          class="absolute top-3 left-3 z-20 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200"
          :class="selectedIds.includes(loc.id)
            ? 'bg-morandi-text scale-105 shadow-md border-transparent'
            : 'border border-black/10 bg-morandi-paper'"
        >
          <svg v-if="selectedIds.includes(loc.id)" class="w-3 h-3 text-morandi-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <!-- 拍立得相纸主体：内圈白框，四周不对称留白 (p-3 pb-7)，弹性高矮拉满对齐 (h-full flex flex-col) -->
        <div 
          class="bg-morandi-paper p-3 pb-7 transition-all duration-500 rounded-none shadow-[0_4px_16px_rgba(0,0,0,0.01),0_16px_48px_rgba(0,0,0,0.03)] h-full flex flex-col"
          :class="[
            selectedIds.includes(loc.id)
              ? 'ring-1 ring-morandi-text/20 shadow-xl'
              : 'hover:shadow-md'
          ]"
        >
          <!-- 3:2 宽画幅底片区 (带微弱描边与内阴影，禁止挤压 shrink-0) -->
          <div class="aspect-[3/2] overflow-hidden bg-morandi-canvas/10 relative border border-black/5 rounded-sm shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] shrink-0">
            <img v-if="loc.coverURL" :src="loc.coverURL" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[800ms]" />
            <div v-else class="w-full h-full flex items-center justify-center text-morandi-text/20 bg-gradient-to-br from-morandi-gstart to-morandi-gend text-4xl font-serif">
              {{ loc.name?.charAt(0) || '?' }}
            </div>
          </div>

          <!-- 不对称相纸宽底边排版 (左对齐，用 / 分割，超长则用 ... 截断，强制贴底 mt-auto) -->
          <div class="pt-4 px-1 text-left space-y-1 mt-auto">
            <!-- 第一行：名称 / 标签 (以 · 分割标签列表，再以 / 与名称分割) -->
            <h2 class="font-serif text-[13px] text-morandi-text font-medium group-hover:text-morandi-red transition-colors duration-300 truncate" :title="[loc.name, loc.tags && loc.tags.length > 0 ? loc.tags.join(' · ') : ''].filter(Boolean).join(' / ')">
              {{ [loc.name, loc.tags && loc.tags.length > 0 ? loc.tags.join(' · ') : ''].filter(Boolean).join(' / ') }}
            </h2>

            <!-- 第二行：地址 -->
            <p v-if="loc.address" class="text-[10px] text-morandi-muted/60 font-sans truncate" :title="loc.address">
              {{ loc.address }}
            </p>
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
      @close="closeDrawer" 
      @save="handleSave"
    >
      <template #header-actions v-if="drawerMode === 'view'">
        <div class="flex items-center gap-3">
          <button @click="switchToEdit" class="rounded-full px-4 py-1.5 border border-morandi-border hover:bg-morandi-text hover:text-morandi-paper transition-colors text-[10px] tracking-widest font-sans">
            编辑 Edit
          </button>
          <button @click="confirmDelete" class="p-1.5 text-morandi-muted hover:text-red-400 hover:bg-red-50 transition-colors" title="删除场地">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </template>

      <!-- 浏览模式 -->
      <LocationView v-if="drawerMode === 'view'" :location="currentLoc" @preview="preview" />

      <!-- 编辑模式 -->
      <LocationForm v-else :form-data="formData" :category="category" />

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
          <h3 class="text-luxury-title-md text-morandi-text mb-2">新建场地</h3>
          <p class="text-luxury-meta-sm text-morandi-muted mb-6">Create New Location</p>
          <div class="mb-8">
            <label class="block text-luxury-meta-sm text-morandi-muted mb-2">输入场地名称</label>
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

    <!-- 全屏预览 -->
    <transition name="fade">
      <div v-if="previewUrl" class="fixed inset-0 z-[100] bg-white/95 flex items-center justify-center p-10 cursor-zoom-out" @click="closePreview">
        <img :src="previewUrl" loading="lazy" class="max-w-full max-h-full shadow-2xl object-contain" />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import ResourceDrawer from '../components/ResourceDrawer.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import LocationView from '../components/Locations/LocationView.vue'
import LocationForm from '../components/Locations/LocationForm.vue'
import FilterPanel from '../components/common/FilterPanel.vue'
import BatchActionBar from '../components/common/BatchActionBar.vue'
import { useLocationStore } from '../store/locationStore'
import { useLibraryPage } from '../composables/useLibraryPage'
import { sanitize } from '../utils/helpers'

const locationStore = useLocationStore()

const selectedRegion = ref('')

const locationSortOptions = [
  { value: 'recently_added', label: '最近添加' },
  { value: 'name_pinyin', label: '名称排序' },
  { value: 'price_asc', label: '价格升序' },
  { value: 'price_desc', label: '价格降序' }
]

const regions = computed(() => {
  const all = locationStore.locations.map(loc => {
    const addr = loc.address || ''
    const match = addr.match(/^([^\s省市区]+[省市])/) || addr.match(/^([^\s]{2,3})/)
    return match ? match[1].substring(0, 3) : ''
  }).filter(Boolean)
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
  store: locationStore,
  storeItems: () => locationStore.locations,
  entityLabel: '场地',
  sortOptions: locationSortOptions,
  folderPrefix: 'new_location_',
  categoryPath: 'locations',
  onRefresh: () => refreshImages(),
})

const filteredLocations = computed(() => {
  return baseFiltered.value.filter(loc => {
    const matchesRegion = !selectedRegion.value || loc.address.includes(selectedRegion.value)
    return matchesRegion
  })
})

const resetFilters = () => {
  baseResetFilters()
  selectedRegion.value = ''
}

const formData = reactive({
  name: '',
  address: '',
  price: '',
  tagsInput: '',
  cover_path: '',
  coverPreview: '',
  images: []
})

const currentLoc = computed(() => {
  if (!editingId.value) return null
  return locationStore.locations.find(l => l.id === editingId.value)
})

const drawerTitle = computed(() => {
  if (drawerMode.value === 'view') return '场地详情'
  return editingId.value ? '编辑场地' : '新建场地'
})

const category = computed(() => {
  if (initialFolderName.value && !initialFolderName.value.startsWith('new_location_')) {
    return `locations/${initialFolderName.value}`
  }
  const base = editingId.value || tempId.value
  const name = sanitize(formData.name)
  const folder = name === 'unnamed' ? `new_location_${base}` : `${name}_${base}`
  initialFolderName.value = folder
  return `locations/${folder}`
})

const refreshImages = async () => {
  await Promise.all(locationStore.locations.map(async (loc) => {
    if (loc.cover_path) {
      loc.coverURL = await window.electronAPI.imageToURL(loc.cover_path)
    } else if (loc.images?.length > 0) {
      const firstImg = loc.images[0]
      const path = typeof firstImg === 'string' ? firstImg : (firstImg.path || firstImg.url)
      if (path) loc.coverURL = await window.electronAPI.imageToURL(path)
    }

    if (loc.images) {
      await Promise.all(loc.images.map(async (img) => {
        if (!img.url || !img.url.startsWith('local-image://')) {
          const path = typeof img === 'string' ? img : (img.path || img.url)
          if (path) img.url = await window.electronAPI.imageToURL(path)
        }
      }))
    }
  }))
}

onMounted(async () => {
  await locationStore.fetchAll()
  await refreshImages()
})

const resetForm = () => {
  formData.name = ''
  formData.address = ''
  formData.price = ''
  formData.tagsInput = ''
  formData.cover_path = ''
  formData.coverPreview = ''
  formData.images = []
}

const confirmNamePromptWithForm = () => {
  confirmNamePrompt(resetForm)
  formData.name = promptName.value.trim()
}

const executeDelete = async () => {
  if (isManageMode.value) {
    await executeBatchDeleteAction()
  } else if (currentLoc.value) {
    await executeSingleDeleteAction(currentLoc.value)
  }
}

const switchToEdit = async () => {
  if (currentLoc.value) {
    editingId.value = currentLoc.value.id
    formData.name = currentLoc.value.name || ''
    formData.address = currentLoc.value.address || ''
    formData.price = currentLoc.value.price || ''
    formData.tagsInput = (currentLoc.value.tags || []).join(', ')
    formData.cover_path = currentLoc.value.cover_path || ''
    formData.images = JSON.parse(JSON.stringify(currentLoc.value.images || []))
    
    if (formData.cover_path) {
      formData.coverPreview = await window.electronAPI.imageToURL(formData.cover_path)
    }
    
    drawerMode.value = 'edit'
  }
}

const confirmDelete = async () => {
  if (!currentLoc.value) return
  confirmMessage.value = `确定要从场地库中删除 "${currentLoc.value.name}" 吗？此操作不可撤销。`
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

  const tags = formData.tagsInput
    .split(/[,，]/)
    .map(t => t.trim())
    .filter(Boolean)

  const dataToSave = {
    name: formData.name,
    address: formData.address,
    price: formData.price,
    tags,
    cover_path: formData.cover_path,
    images: formData.images
  }

  if (editingId.value) {
    await locationStore.update(editingId.value, dataToSave)
  } else {
    const newRecord = await locationStore.create(dataToSave)
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
