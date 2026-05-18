<template>
  <div class="h-full overflow-y-auto px-12 py-10 relative scroll-thin">
    <div class="flex justify-between items-end mb-12">
      <div>
        <h1 class="text-4xl font-serif text-morandi-text/90 mb-2 tracking-[0.1em]">拍摄场地库</h1>
        <p class="text-morandi-muted text-[10px] tracking-[0.3em] uppercase">Location Library / Venues</p>
      </div>
      <button 
        @click="openCreateDrawer"
        class="px-6 py-2 border border-morandi-text text-morandi-text text-sm uppercase tracking-wider hover:bg-morandi-text hover:text-white transition-colors"
      >
        + 新建场地
      </button>
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
        v-for="loc in locationStore.locations" :key="loc.id" 
        class="group cursor-pointer bg-white border border-black/5 overflow-hidden hover:shadow-xl transition-all duration-300"
        @click="openViewDrawer(loc)"
      >
        <div class="aspect-square overflow-hidden bg-black/5 relative">
          <img v-if="loc.coverURL" :src="loc.coverURL" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div v-else class="w-full h-full flex items-center justify-center text-morandi-muted/30 text-4xl font-serif">
            {{ loc.name?.charAt(0) || '?' }}
          </div>
          <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="text-white text-[10px] uppercase tracking-[0.2em] border border-white/50 px-4 py-2">View Detail</span>
          </div>
        </div>
        <div class="text-center p-4 pb-6">
          <h2 class="font-serif text-lg text-morandi-text mb-1">{{ loc.name }}</h2>
          <p class="text-[10px] text-morandi-muted uppercase tracking-widest mb-3 truncate px-2">{{ loc.address }}</p>
          <div class="flex justify-center flex-wrap gap-2">
            <span v-for="tag in loc.tags" :key="tag" class="px-2 py-0.5 text-[9px] uppercase tracking-wider bg-morandi-canvas text-morandi-text border border-black/5">
              {{ tag }}
            </span>
          </div>
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

const executeDelete = async () => {
  if (currentLoc.value) {
    await locationStore.remove(currentLoc.value.id)
    await refreshImages()
    isConfirmOpen.value = false
    isDrawerOpen.value = false
  }
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
