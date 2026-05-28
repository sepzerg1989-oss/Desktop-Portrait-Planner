<template>
  <div class="h-full overflow-y-auto px-12 py-10 relative scroll-thin">
    <div class="flex flex-col md:flex-row justify-between items-stretch md:items-end gap-6 mb-12">
      <div>
        <h1 class="text-4xl font-serif text-morandi-text/90 mb-2 tracking-[0.1em]">拍摄场地库</h1>
        <p class="text-morandi-muted text-[10px] tracking-[0.3em] uppercase">Location Library / Venues</p>
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

        <!-- 批量管理 -->
        <button 
          v-if="locationStore.locations.length > 0"
          @click="isManageMode = !isManageMode"
          :class="[
            'px-6 py-2 text-xs uppercase tracking-wider transition-colors border',
            isManageMode 
              ? 'bg-[#A34A4A] text-white border-transparent' 
              : 'border-morandi-text text-morandi-text hover:bg-morandi-canvas'
          ]"
        >
          {{ isManageMode ? '取消管理' : '批量管理' }}
        </button>

        <button 
          v-if="!isManageMode"
          @click="openCreateDrawer"
          class="px-6 py-2 bg-morandi-text text-white text-sm uppercase tracking-wider hover:bg-black transition-colors"
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
        class="px-8 py-3 bg-morandi-text text-white text-sm uppercase tracking-wider hover:bg-black/80 transition-colors"
      >
        添加第一个场地
      </button>
    </div>

    <!-- 场地卡片墙 -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-8">
      <div 
        v-for="loc in filteredLocations" :key="loc.id" 
        class="group relative cursor-pointer bg-white border overflow-hidden hover:shadow-xl transition-all duration-300"
        :class="[
          selectedIds.includes(loc.id) ? 'border-[#8B9D8B] bg-[#8B9D8B]/5 shadow-lg' : 'border-black/5',
          isManageMode ? 'scale-[0.98]' : ''
        ]"
        @click="handleCardClick(loc)"
      >
        <!-- 批量管理勾选框 -->
        <div 
          v-if="isManageMode" 
          class="absolute top-4 left-4 z-10 w-5 h-5 border rounded flex items-center justify-center transition-colors"
          :class="selectedIds.includes(loc.id) ? 'border-[#8B9D8B] bg-[#8B9D8B]' : 'border-black/20 bg-white'"
        >
          <svg v-if="selectedIds.includes(loc.id)" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div class="aspect-square overflow-hidden bg-black/5 relative">
          <img v-if="loc.coverURL" :src="loc.coverURL" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div v-else class="w-full h-full flex items-center justify-center text-morandi-muted/30 text-4xl font-serif">
            {{ loc.name?.charAt(0) || '?' }}
          </div>
          <div v-if="!isManageMode" class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="text-white text-[10px] uppercase tracking-[0.2em] border border-white/50 px-4 py-2">View Detail</span>
          </div>
        </div>
        <div class="text-center p-4 pb-6">
          <h2 class="font-sans text-base text-morandi-text mb-1 font-medium">{{ loc.name }}</h2>
          <p class="text-[10px] text-morandi-muted uppercase tracking-widest mb-3 truncate px-2">{{ loc.address }}</p>
          <div class="flex justify-center flex-wrap gap-2">
            <span v-for="tag in loc.tags" :key="tag" class="px-2 py-0.5 text-[9px] uppercase tracking-wider bg-morandi-canvas text-morandi-text border border-black/5">
              {{ tag }}
            </span>
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
          <button @click="switchToEdit" class="px-4 py-1.5 text-xs uppercase tracking-widest border border-morandi-text text-morandi-text hover:bg-morandi-text hover:text-white transition-colors">
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
      <LocationView v-if="drawerMode === 'view'" :location="currentLoc" @preview="previewImage" />

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
        <div class="bg-white p-8 shadow-2xl w-[400px]">
          <h3 class="text-xl font-serif text-morandi-text mb-2">新建场地</h3>
          <p class="text-[10px] uppercase tracking-widest text-morandi-muted mb-6">Create New Location</p>
          <div class="mb-8">
            <label class="block text-xs uppercase tracking-wider text-morandi-muted mb-2">输入场地名称</label>
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

    <!-- 全屏预览 -->
    <transition name="fade">
      <div v-if="previewUrl" class="fixed inset-0 z-[100] bg-white/95 flex items-center justify-center p-10 cursor-zoom-out" @click="previewUrl = null">
        <img :src="previewUrl" class="max-w-full max-h-full shadow-2xl object-contain" />
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

const locationStore = useLocationStore()
const isDrawerOpen = ref(false)
const drawerMode = ref('view') // 'view' | 'edit'
const editingId = ref(null)
const previewUrl = ref(null)

const isConfirmOpen = ref(false)
const confirmMessage = ref('')
const showNamePrompt = ref(false)
const promptName = ref('')
const tempId = ref(null) // 用于暂存未保存场地的文件目录 ID
const initialFolderName = ref('') // 会话开始时的文件夹名称

// 筛选与批量状态
const searchQuery = ref('')
const selectedRegion = ref('')
const selectedTags = ref([])
const isManageMode = ref(false)
const selectedIds = ref([])
const selectedSort = ref('recently_added')

const locationSortOptions = [
  { value: 'recently_added', label: '最近添加' },
  { value: 'name_pinyin', label: '名称排序' },
  { value: 'price_asc', label: '价格升序' },
  { value: 'price_desc', label: '价格降序' }
]

// 从场地地址中智能解析地区 (前2-3字城市)
const regions = computed(() => {
  const all = locationStore.locations.map(loc => {
    const addr = loc.address || ''
    const match = addr.match(/^([^\s省市区]+[省市])/) || addr.match(/^([^\s]{2,3})/)
    return match ? match[1].substring(0, 3) : ''
  }).filter(Boolean)
  return [...new Set(all)]
})

// 从场地中提取所有标签
const allTags = computed(() => {
  const tags = locationStore.locations.flatMap(l => l.tags || []).filter(Boolean)
  return [...new Set(tags)]
})

// 辅助函数：从混合文本中智能抓取数值用于价格精准排序，无数值者归为最底端
const parseNumericPrice = (priceStr) => {
  if (!priceStr) return 0
  const match = String(priceStr).match(/(\d+(\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}

// 实时响应式过滤与智能排序
const filteredLocations = computed(() => {
  // 1. 过滤
  let list = locationStore.locations.filter(loc => {
    const matchesSearch = !searchQuery.value.trim() ||
      loc.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      loc.tags.some(t => t.toLowerCase().includes(searchQuery.value.toLowerCase()))
      
    const matchesRegion = !selectedRegion.value || loc.address.includes(selectedRegion.value)
    
    const matchesTags = selectedTags.value.length === 0 ||
      selectedTags.value.every(t => loc.tags.includes(t))
      
    return matchesSearch && matchesRegion && matchesTags
  })

  // 2. 排序
  list.sort((a, b) => {
    if (selectedSort.value === 'recently_added') {
      const timeA = new Date(a.created_at).getTime()
      const timeB = new Date(b.created_at).getTime()
      return timeB - timeA
    } else if (selectedSort.value === 'name_pinyin') {
      return (a.name || '').localeCompare(b.name || '', 'zh-CN')
    } else if (selectedSort.value === 'price_asc') {
      const pA = parseNumericPrice(a.price)
      const pB = parseNumericPrice(b.price)
      if (pA === 0 && pB > 0) return 1
      if (pB === 0 && pA > 0) return -1
      return pA - pB
    } else if (selectedSort.value === 'price_desc') {
      const pA = parseNumericPrice(a.price)
      const pB = parseNumericPrice(b.price)
      if (pA === 0 && pB > 0) return 1
      if (pB === 0 && pA > 0) return -1
      return pB - pA
    }
    return 0
  })

  return list
})

// 判断是否已全部选中当前过滤场地
const isAllSelected = computed(() => {
  if (filteredLocations.value.length === 0) return false
  return filteredLocations.value.every(l => selectedIds.value.includes(l.id))
})

const sanitize = (name) => {
  return (name || '').replace(/[\\\/:\*\?"<>\|]/g, '_').trim() || 'unnamed'
}

const getFolderName = () => {
  if (initialFolderName.value && !initialFolderName.value.startsWith('new_location_')) {
    return initialFolderName.value
  }
  const base = editingId.value || tempId.value
  const name = sanitize(formData.name)
  const newName = name === 'unnamed' ? `new_location_${base}` : `${name}_${base}`
  initialFolderName.value = newName
  return newName
}

const category = computed(() => `locations/${getFolderName()}`)

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

const resetFilters = () => {
  searchQuery.value = ''
  selectedRegion.value = ''
  selectedTags.value = []
  selectedSort.value = 'recently_added'
}

// 拦截式卡片点击逻辑 (方案 A)
const handleCardClick = (loc) => {
  if (isManageMode.value) {
    const idx = selectedIds.value.indexOf(loc.id)
    if (idx === -1) {
      selectedIds.value.push(loc.id)
    } else {
      selectedIds.value.splice(idx, 1)
    }
  } else {
    openViewDrawer(loc)
  }
}

// 全选当前过滤场地
const toggleAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => 
      !filteredLocations.value.some(l => l.id === id)
    )
  } else {
    filteredLocations.value.forEach(loc => {
      if (!selectedIds.value.includes(loc.id)) {
        selectedIds.value.push(loc.id)
      }
    })
  }
}

// 触发批量删除确认
const executeBatchDelete = () => {
  if (selectedIds.value.length === 0) return
  confirmMessage.value = `确定要批量删除选中的 ${selectedIds.value.length} 个场地吗？此操作将永久物理删除所有选定场地的照片与图片，且无法撤销！`
  isConfirmOpen.value = true
}

const executeDelete = async () => {
  if (isManageMode.value) {
    // 批量删除
    await locationStore.removeBatch(selectedIds.value)
    selectedIds.value = []
    isManageMode.value = false
    await refreshImages()
    isConfirmOpen.value = false
  } else if (currentLoc.value) {
    // 单个删除
    await locationStore.remove(currentLoc.value.id)
    await refreshImages()
    isConfirmOpen.value = false
    isDrawerOpen.value = false
  }
}

const cancelManageMode = () => {
  isManageMode.value = false
  selectedIds.value = []
}

const resetForm = () => {
  formData.name = ''
  formData.address = ''
  formData.price = ''
  formData.tagsInput = ''
  formData.cover_path = ''
  formData.coverPreview = ''
  formData.images = []
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

const openViewDrawer = (loc) => {
  editingId.value = loc.id
  initialFolderName.value = `${sanitize(loc.name)}_${loc.id}`
  drawerMode.value = 'view'
  isDrawerOpen.value = true
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

const closeDrawer = async () => {
  if (drawerMode.value === 'edit' && !editingId.value && tempId.value) {
    await window.electronAPI.cleanupTempFolder(`locations/${initialFolderName.value}`)
  }
  isDrawerOpen.value = false
}

const previewImage = (url) => {
  previewUrl.value = url
}

const confirmDelete = async () => {
  if (!currentLoc.value) return
  confirmMessage.value = `确定要从场地库中删除 "${currentLoc.value.name}" 吗？此操作不可撤销。`
  isConfirmOpen.value = true
}

const handleSave = async () => {
  if (drawerMode.value === 'view') {
    closeDrawer()
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
