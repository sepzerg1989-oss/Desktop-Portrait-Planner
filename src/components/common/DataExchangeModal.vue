<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300">
    <div class="bg-[#F5F4F0] rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-[#E2DED0]">
      <!-- Header -->
      <div class="px-6 py-5 border-b border-[#E2DED0] flex items-center justify-between bg-white/50">
        <div>
          <h2 class="text-xl font-medium text-[#4A4A4A]">导出数据包</h2>
          <p class="text-sm text-[#8C8C8C] mt-1">选择您需要分享的策划案、模特或场地，系统将自动打包所有相关图片和配置</p>
        </div>
        <button @click="close" class="text-[#8C8C8C] hover:text-[#4A4A4A] transition-colors p-2 rounded-full hover:bg-[#E2DED0]/50">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex px-6 border-b border-[#E2DED0] bg-[#F5F4F0]">
        <button v-for="tab in tabs" :key="tab.id"
                @click="activeTab = tab.id"
                class="px-5 py-3 text-sm font-medium border-b-2 transition-colors duration-200"
                :class="activeTab === tab.id ? 'border-[#8B9D8B] text-[#4A4A4A]' : 'border-transparent text-[#8C8C8C] hover:text-[#4A4A4A]'">
          {{ tab.label }}
          <span class="ml-1 px-2 py-0.5 rounded-full text-xs" :class="activeTab === tab.id ? 'bg-[#8B9D8B]/10 text-[#8B9D8B]' : 'bg-[#E2DED0]/50 text-[#8C8C8C]'">
             {{ selectedCounts[tab.id] }} / {{ getList(tab.id).length }}
          </span>
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-6 bg-white/30">
        <!-- 搜索与全选工具栏 -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
          <!-- Select All Bar -->
          <div class="flex-1 flex items-center justify-between px-4 py-2 bg-transparent border border-black/10">
            <label class="flex items-center cursor-pointer group">
              <div class="relative flex items-center justify-center w-5 h-5 mr-3 border group-hover:border-morandi-text transition-colors"
                   :class="isAllSelected ? 'border-morandi-text bg-morandi-text' : 'border-black/20 bg-white/50'">
                <svg v-if="isAllSelected" class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
                <input type="checkbox" class="absolute opacity-0 w-0 h-0" :checked="isAllSelected" @change="toggleSelectAll">
              </div>
              <span class="text-sm font-medium text-[#4A4A4A]">全选此页内容</span>
            </label>
          </div>

          <!-- 极简搜索框 -->
          <div class="relative min-w-[240px]">
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="快速搜索此分类..."
              class="w-full px-4 py-2 border border-black/10 bg-transparent outline-none focus:border-morandi-text text-xs transition-all font-sans"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-morandi-muted hover:text-morandi-text text-sm">×</button>
          </div>
        </div>

        <!-- List -->
        <div v-if="filteredList.length === 0" class="flex flex-col items-center justify-center py-16 text-[#8C8C8C]">
          <svg class="w-12 h-12 mb-3 text-[#C5C5C5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p>暂无数据</p>
        </div>
        
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label v-for="item in filteredList" :key="item.id" 
                 class="flex items-center p-3 border transition-all cursor-pointer group animate-in fade-in duration-300"
                 :class="isSelected(activeTab, item.id) ? 'bg-[#8B9D8B]/5 border-morandi-text/30' : 'bg-transparent border-black/5 hover:border-black/20'">
            
            <div class="relative flex items-center justify-center w-5 h-5 mx-3 shrink-0 border group-hover:border-morandi-text transition-colors"
                 :class="isSelected(activeTab, item.id) ? 'border-morandi-text bg-morandi-text' : 'border-black/20 bg-white/50'">
              <svg v-if="isSelected(activeTab, item.id)" class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
              <input type="checkbox" class="absolute opacity-0 w-0 h-0" :checked="isSelected(activeTab, item.id)" @change="toggleItem(activeTab, item.id)">
            </div>

            <!-- Item Preview -->
            <div class="flex items-center flex-1 min-w-0 pr-2">
              <div class="w-12 h-12 bg-[#E2DED0] shrink-0 mr-3 overflow-hidden">
                <img v-if="getCover(activeTab, item)" :src="getCover(activeTab, item)" class="w-full h-full object-cover">
                <div v-else class="w-full h-full flex items-center justify-center text-[#8C8C8C]">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                   </svg>
                </div>
              </div>
              <div class="flex-1 truncate">
                <h4 class="text-[15px] text-[#4A4A4A] truncate font-medium">{{ getName(activeTab, item) }}</h4>
                <p class="text-xs text-[#8C8C8C] mt-1">{{ item.created_at?.split(' ')[0] || '未知时间' }}</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-[#E2DED0] bg-white flex justify-between items-center rounded-b-2xl">
        <div class="text-sm text-[#8C8C8C]">
          已选 <span class="text-[#4A4A4A] font-medium">{{ totalSelected }}</span> 项
        </div>
        <div class="space-x-3">
          <button @click="close" class="px-5 py-2 text-sm font-medium text-[#8C8C8C] hover:text-[#4A4A4A] transition-colors rounded-lg hover:bg-[#F5F4F0]">
            取消
          </button>
          <button @click="handleExport" :disabled="totalSelected === 0 || isExporting" 
                  class="px-6 py-2 text-sm font-medium text-white bg-[#4A4A4A] hover:bg-[#333333] transition-colors rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
            <svg v-if="isExporting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isExporting ? '打包中...' : '导出所选数据' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { usePlanStore } from '../../store/planStore'
import { useModelStore } from '../../store/modelStore'
import { useLocationStore } from '../../store/locationStore'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['update:isOpen', 'success'])

const planStore = usePlanStore()
const modelStore = useModelStore()
const locationStore = useLocationStore()

const tabs = [
  { id: 'plans', label: '策划方案' },
  { id: 'models', label: '模特库' },
  { id: 'locations', label: '场地库' }
]

const activeTab = ref('plans')
const isExporting = ref(false)

// 使用 reactive 对象映射，确保在列表循环中的完美绝对响应式
const selections = reactive({
  plans: {}, // { [id]: boolean }
  models: {},
  locations: {}
})

// 极简模糊搜索框绑定值
const searchQuery = ref('')

// 基于分类和搜索词做实时响应式筛选列表
const filteredList = computed(() => {
  const list = getList(activeTab.value)
  if (!searchQuery.value.trim()) return list
  const query = searchQuery.value.toLowerCase()
  return list.filter(item => {
    if (activeTab.value === 'plans') {
      return item.title?.toLowerCase().includes(query)
    }
    if (activeTab.value === 'models') {
      return item.name?.toLowerCase().includes(query) || 
        item.tags?.some(t => t.toLowerCase().includes(query))
    }
    if (activeTab.value === 'locations') {
      return item.name?.toLowerCase().includes(query) || 
        item.address?.toLowerCase().includes(query) ||
        item.tags?.some(t => t.toLowerCase().includes(query))
    }
    return false
  })
})

// 切换 Tab 时重置搜索词
watch(activeTab, () => {
  searchQuery.value = ''
})

// 加载数据
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    activeTab.value = 'plans'
    selections.plans = {}
    selections.models = {}
    selections.locations = {}
    await Promise.all([
      planStore.fetchPlans(),
      modelStore.fetchAll(),
      locationStore.fetchAll()
    ])
  }
})

const getList = (tabId) => {
  if (tabId === 'plans') return planStore.plans
  if (tabId === 'models') return modelStore.models
  if (tabId === 'locations') return locationStore.locations
  return []
}

const getPlanCover = (plan) => {
  if (!plan.modules_json) return null
  try {
    const modules = typeof plan.modules_json === 'string' 
      ? JSON.parse(plan.modules_json) 
      : plan.modules_json
    const themeModule = modules.find(m => m.type === 'theme')
    if (themeModule && themeModule.data?.images?.length > 0) {
      const firstImg = themeModule.data.images[0]
      return firstImg.path || firstImg.url || firstImg
    }
  } catch (e) {
    console.warn('解析封面失败:', e)
  }
  return null
}

const getCover = (tabId, item) => {
  let path = ''
  if (tabId === 'plans') {
    path = getPlanCover(item)
  } else if (tabId === 'models') {
    path = item.avatar_path
  } else if (tabId === 'locations') {
    path = item.cover_path
  }
  
  if (!path) return ''
  if (path.startsWith('local-image://')) return path
  return window.electronAPI.imageToURL(path)
}

const getName = (tabId, item) => {
  if (tabId === 'plans') return item.title || '未命名'
  if (tabId === 'models') return item.name || '未命名'
  if (tabId === 'locations') return item.name || '未命名'
  return ''
}

const isSelected = (tabId, id) => {
  return !!selections[tabId][id]
}

const toggleItem = (tabId, id) => {
  selections[tabId][id] = !selections[tabId][id]
}

const selectedCounts = computed(() => {
  return {
    plans: Object.values(selections.plans).filter(Boolean).length,
    models: Object.values(selections.models).filter(Boolean).length,
    locations: Object.values(selections.locations).filter(Boolean).length
  }
})

const totalSelected = computed(() => {
  return selectedCounts.value.plans + selectedCounts.value.models + selectedCounts.value.locations
})

const isAllSelected = computed(() => {
  const list = filteredList.value
  if (list.length === 0) return false
  return list.every(item => selections[activeTab.value][item.id])
})

const toggleSelectAll = () => {
  const list = filteredList.value
  if (isAllSelected.value) {
    list.forEach(item => {
      selections[activeTab.value][item.id] = false
    })
  } else {
    list.forEach(item => {
      selections[activeTab.value][item.id] = true
    })
  }
}

const close = () => {
  emit('update:isOpen', false)
}

const handleExport = async () => {
  if (totalSelected.value === 0) return
  isExporting.value = true
  
  try {
    const ids = {
      planIds: Object.keys(selections.plans).filter(id => selections.plans[id]).map(Number),
      modelIds: Object.keys(selections.models).filter(id => selections.models[id]).map(Number),
      locationIds: Object.keys(selections.locations).filter(id => selections.locations[id]).map(Number)
    }
    
    const res = await window.electronAPI.exportData(ids)
    if (res.success) {
      alert('导出成功：' + res.filePath)
      close()
    } else if (res.error !== 'User canceled') {
      alert('导出失败: ' + res.error)
    }
  } catch (error) {
    alert('导出异常: ' + error.message)
  } finally {
    isExporting.value = false
  }
}
</script>
