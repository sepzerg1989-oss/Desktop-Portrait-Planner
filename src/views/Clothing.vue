<template>
  <div class="h-full overflow-y-auto px-12 py-10 relative select-none font-sans bg-morandi-canvas text-morandi-text">
    <div class="flex flex-col md:flex-row justify-between items-stretch md:items-end gap-6 mb-12 border-b border-morandi-border/20 pb-6">
      <div>
        <h1 class="text-4xl font-serif text-morandi-text/90 mb-2 tracking-[0.1em]">服装搭配库</h1>
        <p class="text-morandi-muted text-[10px] tracking-[0.3em] uppercase">Clothing Library / Lookbook</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <!-- 检索过滤面板 -->
        <FilterPanel 
          v-if="clothingStore.clothings.length > 0 && !isManageMode"
          v-model:searchQuery="searchQuery"
          v-model:selectedTags="selectedTags"
          v-model:selectedSort="selectedSort"
          :sortOptions="clothingSortOptions"
          :tags="allTags"
          @reset="resetFilters"
        />

        <!-- 批量管理 -->
        <button 
          v-if="clothingStore.clothings.length > 0 && !isManageMode"
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
          + 新增搭配
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="clothingStore.loading" class="flex justify-center items-center py-20">
      <p class="text-morandi-muted text-sm uppercase tracking-widest">Loading...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="clothingStore.clothings.length === 0" class="flex flex-col items-center justify-center py-32">
      <div class="text-6xl text-morandi-muted/30 mb-8 font-serif">✉</div>
      <p class="text-morandi-muted text-xs uppercase tracking-widest mb-6">尚无服装数据 / No Clothing Data</p>
      <button 
        @click="openCreateDrawer"
        class="px-8 py-3 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity outline-none font-medium"
      >
        添加第一件搭配
      </button>
    </div>

    <!-- 服装卡片墙 (博物学图鉴，3:4 比例无白边) -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-8">
      <div 
        v-for="clothing in filteredClothings" :key="clothing.id" 
        class="group relative cursor-pointer bg-morandi-paper border border-morandi-border/30 transition-all duration-500 rounded-none overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.01)]"
        :class="[
          selectedIds.includes(clothing.id)
            ? 'border-morandi-text/40 shadow-md scale-[1.02]'
            : 'hover:scale-[1.02] hover:border-morandi-text/20',
          isManageMode ? 'scale-[0.98]' : ''
        ]"
        @click="handleCardClick(clothing)"
      >
        <!-- 正圆形漂浮复选框 -->
        <div 
          v-if="isManageMode" 
          class="absolute top-3 left-3 z-10 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200"
          :class="selectedIds.includes(clothing.id)
            ? 'bg-morandi-text scale-105 shadow-md border-transparent'
            : 'border border-black/10 bg-morandi-paper'"
        >
          <svg v-if="selectedIds.includes(clothing.id)" class="w-3 h-3 text-morandi-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <!-- 3:4 比例竖图区 (满宽贴边) -->
        <div class="aspect-[3/4] overflow-hidden bg-morandi-canvas/10 border-b border-morandi-border/10">
          <img v-if="clothing.coverURL" :src="clothing.coverURL" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div v-else class="w-full h-full flex items-center justify-center text-morandi-text/20 bg-gradient-to-br from-morandi-gstart to-morandi-gend text-5xl font-serif">
            {{ clothing.name?.charAt(0) || '?' }}
          </div>
        </div>

        <!-- 文字排版参数 (左对齐，下方留白) -->
        <div class="p-4 pb-6 space-y-1.5 text-left">
          <!-- 第一行：名称 / 标签 -->
          <h2 class="font-serif text-[13px] text-morandi-text font-bold group-hover:text-morandi-red transition-colors duration-300 truncate">
            {{ clothing.name }}
            <span v-if="clothing.tags && clothing.tags.length > 0" class="font-sans font-normal text-[9px] text-morandi-muted/80 tracking-wider ml-1">
              / {{ clothing.tags.join(' · ') }}
            </span>
          </h2>

          <!-- 第二行：描述 -->
          <p v-if="clothing.description" class="text-[10px] text-morandi-muted/80 truncate font-sans leading-relaxed">
            {{ clothing.description }}
          </p>
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
          <button @click="confirmDelete" class="p-1.5 text-morandi-muted hover:text-red-400 hover:bg-red-50 transition-colors" title="删除搭配">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </template>

      <!-- 浏览模式 -->
      <ClothingView v-if="drawerMode === 'view'" :clothing="currentClothing" @preview="previewImage" />

      <!-- 编辑模式 -->
      <ClothingForm v-else-if="drawerMode === 'edit'" :form-data="formData" :category="category" />

      <template #footer v-if="drawerMode === 'view'">
        <div class="text-xs text-morandi-muted text-center w-full pb-2">Clothing Collection</div>
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
          <h3 class="text-xl font-serif text-morandi-text mb-2">新建服装搭配</h3>
          <p class="text-[10px] uppercase tracking-widest text-morandi-muted mb-6">Create New Outfit</p>
          <div class="mb-8">
            <label class="block text-xs uppercase tracking-wider text-morandi-muted mb-2">输入搭配名称</label>
            <input 
              v-model="promptName" 
              type="text" 
              class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-sm text-morandi-text rounded-none" 
              placeholder="必填..."
              @keyup.enter="confirmNamePrompt"
            />
          </div>
          <div class="flex justify-end gap-3">
            <button @click="cancelNamePrompt" class="px-6 py-2 text-[11px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors font-medium outline-none">
              取消 / Cancel
            </button>
            <button 
              @click="confirmNamePrompt" 
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
        <img :src="previewUrl" class="max-w-full max-h-full object-contain shadow-[0_30px_100px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300" @click.stop />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import ResourceDrawer from '../components/ResourceDrawer.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import ClothingView from '../components/Clothing/ClothingView.vue'
import ClothingForm from '../components/Clothing/ClothingForm.vue'
import FilterPanel from '../components/common/FilterPanel.vue'
import BatchActionBar from '../components/common/BatchActionBar.vue'
import { useClothingStore } from '../store/clothingStore'

const clothingStore = useClothingStore()
const isDrawerOpen = ref(false)
const drawerMode = ref('view') // 'view' or 'edit'
const editingId = ref(null)
const tempId = ref(null) // 未保存实体临时 ID
const initialFolderName = ref('') // 会话级文件夹名称
const previewUrl = ref(null)

// 筛选及批量状态
const searchQuery = ref('')
const selectedTags = ref([])
const isManageMode = ref(false)
const selectedIds = ref([])
const selectedSort = ref('recently_added')

const clothingSortOptions = [
  { value: 'recently_added', label: '最近添加' },
  { value: 'name_pinyin', label: '名称排序' },
  { value: 'price_asc', label: '价格升序' },
  { value: 'price_desc', label: '价格降序' }
]

// 自动提取所有服装标签
const allTags = computed(() => {
  const tags = clothingStore.clothings.flatMap(c => c.tags || []).filter(Boolean)
  return [...new Set(tags)]
})

// 辅助价格数值化排序解析
const parseNumericPrice = (priceStr) => {
  if (!priceStr) return 0
  const match = String(priceStr).match(/(\d+(\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}

// 实时响应式多分类检索过滤
const filteredClothings = computed(() => {
  let list = clothingStore.clothings.filter(c => {
    const matchesSearch = !searchQuery.value.trim() || 
      c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(searchQuery.value.toLowerCase()))
    
    const matchesTags = selectedTags.value.length === 0 || 
      selectedTags.value.every(t => c.tags.includes(t))
      
    return matchesSearch && matchesTags
  })

  // 排序
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

const isAllSelected = computed(() => {
  if (filteredClothings.value.length === 0) return false
  return filteredClothings.value.every(c => selectedIds.value.includes(c.id))
})

const sanitize = (name) => {
  return (name || '').replace(/[\\\/:\*\?"<>\|]/g, '_').trim() || 'unnamed'
}

const getFolderName = () => {
  if (initialFolderName.value && !initialFolderName.value.startsWith('new_clothing_')) {
    return initialFolderName.value
  }
  const base = editingId.value || tempId.value
  const name = sanitize(formData.name)
  const newName = name === 'unnamed' ? `new_clothing_${base}` : `${name}_${base}`
  initialFolderName.value = newName
  return newName
}

const category = computed(() => `clothing/${getFolderName()}`)

// 弹出与确认状态
const isConfirmOpen = ref(false)
const confirmMessage = ref('')
const showNamePrompt = ref(false)
const promptName = ref('')

const currentClothing = computed(() => {
  if (!editingId.value) return null
  return clothingStore.clothings.find(c => c.id === editingId.value)
})

const drawerTitle = computed(() => {
  if (drawerMode.value === 'view') return '搭配档案'
  return editingId.value ? '编辑搭配' : '新建搭配'
})

const formData = reactive({
  name: '',
  description: '',
  tagsInput: '',
  link: '',
  price: '',
  images: []
})

// 默认首图路径映射 (化繁为简的核心)
const refreshImages = async () => {
  await Promise.all(clothingStore.clothings.map(async (item) => {
    if (item.images && item.images.length > 0) {
      const firstImg = item.images[0]
      const path = typeof firstImg === 'string' ? firstImg : (firstImg.path || firstImg.url)
      item.coverURL = await window.electronAPI.imageToURL(path)
    } else {
      item.coverURL = ''
    }
    // 同步图册的所有 URL，以便在详情中能够直接渲染
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
  await clothingStore.fetchAll()
  await refreshImages()
})

const resetFilters = () => {
  searchQuery.value = ''
  selectedTags.value = []
  selectedSort.value = 'recently_added'
}

const handleCardClick = (clothing) => {
  if (isManageMode.value) {
    const idx = selectedIds.value.indexOf(clothing.id)
    if (idx === -1) {
      selectedIds.value.push(clothing.id)
    } else {
      selectedIds.value.splice(idx, 1)
    }
  } else {
    openViewDrawer(clothing)
  }
}

const toggleAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => 
      !filteredClothings.value.some(c => c.id === id)
    )
  } else {
    filteredClothings.value.forEach(clothing => {
      if (!selectedIds.value.includes(clothing.id)) {
        selectedIds.value.push(clothing.id)
      }
    })
  }
}

const executeBatchDelete = () => {
  if (selectedIds.value.length === 0) return
  confirmMessage.value = `确定要批量删除选中的 ${selectedIds.value.length} 件搭配吗？此操作将永久物理删除所有选定搭配相册，且无法撤销！`
  isConfirmOpen.value = true
}

const executeDelete = async () => {
  if (isManageMode.value) {
    await clothingStore.removeBatch(selectedIds.value)
    selectedIds.value = []
    isManageMode.value = false
    await refreshImages()
    isConfirmOpen.value = false
  } else if (currentClothing.value) {
    await clothingStore.remove(currentClothing.value.id)
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
  formData.description = ''
  formData.tagsInput = ''
  formData.link = ''
  formData.price = ''
  formData.images = []
}

const fillFormFromClothing = async (clothing) => {
  editingId.value = clothing.id
  formData.name = clothing.name || ''
  formData.description = clothing.description || ''
  formData.tagsInput = (clothing.tags || []).join(', ')
  formData.link = clothing.link || ''
  formData.price = clothing.price || ''
  formData.images = JSON.parse(JSON.stringify(clothing.images || []))
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

const openViewDrawer = async (clothing) => {
  editingId.value = clothing.id
  initialFolderName.value = `${sanitize(clothing.name)}_${clothing.id}`
  drawerMode.value = 'view'
  isDrawerOpen.value = true
}

const switchToEdit = async () => {
  if (currentClothing.value) {
    await fillFormFromClothing(currentClothing.value)
    drawerMode.value = 'edit'
  }
}

const confirmDelete = async () => {
  if (!currentClothing.value) return
  confirmMessage.value = `确定要从搭配库中删除 "${currentClothing.value.name}" 吗？此操作不可撤销。`
  isConfirmOpen.value = true
}

const closeDrawer = async () => {
  if (drawerMode.value === 'edit' && !editingId.value && tempId.value) {
    await window.electronAPI.cleanupTempFolder(`clothing/${initialFolderName.value}`)
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
    description: formData.description,
    tags: formData.tagsInput.split(/[,，]/).map(s => s.trim()).filter(Boolean),
    link: formData.link,
    price: formData.price,
    images: formData.images
  }

  if (editingId.value) {
    await clothingStore.update(editingId.value, dataToSave)
  } else {
    const newRecord = await clothingStore.create(dataToSave)
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
