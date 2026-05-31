<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300">
    <!-- 弹窗主体 (高奢直角卡纸与复合深阴影) -->
    <div class="bg-morandi-paper shadow-[0_24px_64px_rgba(0,0,0,0.12)] w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-morandi-border rounded-none animate-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="px-8 py-6 border-b border-morandi-border flex items-center justify-between bg-transparent">
        <div>
          <h2 class="text-xl font-serif text-morandi-text">导出数据包</h2>
          <p class="text-[10px] uppercase tracking-widest text-morandi-muted mt-1.5">Export Backup Package / Share</p>
          <p class="text-xs text-morandi-muted mt-2 leading-relaxed max-w-xl font-sans">
            选择您需要分享的策划案、模特、场地或新增搭配、道具、妆容，系统将自动打包所有相关图片和配置，并生成本地数据包。
          </p>
        </div>
        <button @click="close" class="text-morandi-muted hover:text-morandi-text transition-colors p-2 hover:bg-morandi-text/5 rounded-full outline-none">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Tabs (打字机裸排元标签风) -->
      <div class="flex px-8 border-b border-morandi-border bg-transparent gap-1 overflow-x-auto scrollbar-none">
        <button v-for="tab in tabs" :key="tab.id"
                @click="activeTab = tab.id"
                class="px-3.5 py-3 text-xs uppercase tracking-widest transition-all duration-300 border-b-2 font-medium outline-none shrink-0"
                :class="activeTab === tab.id ? 'border-morandi-text text-morandi-text' : 'border-transparent text-morandi-muted hover:text-morandi-text'">
          {{ tab.label }}
          <span class="ml-1.5 text-[10px] text-morandi-muted font-sans font-normal">
             ({{ selectedCounts[tab.id] }} / {{ getList(tab.id).length }})
          </span>
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-8 bg-transparent scroll-thin">
        <!-- 搜索与全选工具栏 -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-6 mb-6">
          <!-- Select All Bar (Ghost 无底色极简) -->
          <div class="flex-1 flex items-center justify-between py-2 border-b border-morandi-border bg-transparent">
            <label class="flex items-center cursor-pointer group select-none">
              <!-- 精致正圆形五金复选框 -->
              <div class="relative flex items-center justify-center w-4.5 h-4.5 mr-3 rounded-full border transition-all duration-300 shrink-0"
                   :class="isAllSelected ? 'border-transparent bg-morandi-text scale-105 shadow-md' : 'border-morandi-text/20 bg-morandi-paper group-hover:border-morandi-text'">
                <svg v-if="isAllSelected" class="w-3 h-3 text-morandi-paper" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                <input type="checkbox" class="absolute opacity-0 w-0 h-0" :checked="isAllSelected" @change="toggleSelectAll">
              </div>
              <span class="text-xs uppercase tracking-wider text-morandi-text font-medium">全选此页内容 / Select All</span>
            </label>
          </div>

          <!-- Ghost 极简下划线搜索框 -->
          <div class="relative min-w-[240px]">
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="快速搜索此分类..."
              class="w-full px-1 py-2 border-b border-morandi-border bg-transparent outline-none focus:border-morandi-text text-xs transition-all font-sans rounded-none text-morandi-text"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-1 top-1/2 -translate-y-1/2 text-morandi-muted hover:text-morandi-text text-sm">×</button>
          </div>
        </div>

        <!-- List -->
        <div v-if="filteredList.length === 0" class="flex flex-col items-center justify-center py-20 text-morandi-muted">
          <svg class="w-10 h-10 mb-4 text-morandi-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p class="text-xs uppercase tracking-widest font-sans font-medium">暂无可用数据 / Empty</p>
        </div>
        
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-1">
          <label v-for="item in filteredList" :key="item.id" 
                 class="flex items-center p-3 border transition-all duration-300 cursor-pointer group animate-in fade-in rounded-none select-none"
                 :class="isSelected(activeTab, item.id) 
                   ? 'bg-morandi-text/[0.02] border-morandi-text/40 shadow-sm -translate-y-[1px]' 
                   : 'bg-transparent border-morandi-border hover:border-morandi-text/40 hover:-translate-y-[1px]'">
            
            <!-- 卡片五金精细圆形复选框 -->
            <div class="relative flex items-center justify-center w-4.5 h-4.5 mx-3 shrink-0 rounded-full border transition-all duration-300"
                 :class="isSelected(activeTab, item.id) 
                   ? 'border-transparent bg-morandi-text scale-105 shadow-md' 
                   : 'border-morandi-text/20 bg-morandi-paper group-hover:border-morandi-text'">
              <svg v-if="isSelected(activeTab, item.id)" class="w-3 h-3 text-morandi-paper" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              <input type="checkbox" class="absolute opacity-0 w-0 h-0" :checked="isSelected(activeTab, item.id)" @change="toggleItem(activeTab, item.id)">
            </div>

            <!-- Item Preview (Polaroid 微缩感相纸封) -->
            <div class="flex items-center flex-1 min-w-0 pr-2">
              <div class="w-12 h-12 bg-morandi-canvas/30 shrink-0 mr-3 overflow-hidden rounded-sm border border-morandi-border/30 shadow-[inset_0_1px_3px_rgba(0,0,0,0.01)] relative">
                <img v-if="getCover(activeTab, item)" :src="getCover(activeTab, item)" class="w-full h-full object-cover">
                <div v-else class="w-full h-full flex items-center justify-center text-morandi-text/20 bg-gradient-to-br from-morandi-gstart to-morandi-gend text-sm font-serif">
                   {{ getName(activeTab, item)?.charAt(0) || '?' }}
                </div>
              </div>
              <div class="flex-1 truncate">
                <h4 class="text-sm text-morandi-text truncate font-medium group-hover:text-morandi-red transition-colors duration-300">{{ getName(activeTab, item) }}</h4>
                <p class="text-[9px] text-morandi-muted uppercase tracking-widest font-sans mt-1">{{ item.created_at?.split(' ')[0] || '未知时间' }}</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Footer (大一统高奢胶囊) -->
      <div class="px-8 py-5 border-t border-morandi-border flex justify-between items-center rounded-none bg-transparent">
        <div class="text-[11px] uppercase tracking-widest text-morandi-muted font-sans font-medium select-none">
          已选择 <span class="text-morandi-text font-bold text-xs">{{ totalSelected }}</span> 项 / Selected
        </div>
        <div class="flex items-center gap-3">
          <button @click="close" class="px-6 py-2 text-[11px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors font-medium outline-none">
            取消 Cancel
          </button>
          <button @click="handleExport" :disabled="totalSelected === 0 || isExporting" 
                  class="px-6 py-2 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity disabled:opacity-30 disabled:pointer-events-none font-medium outline-none shadow-sm flex items-center gap-2">
            <svg v-if="isExporting" class="animate-spin h-3.5 w-3.5 text-morandi-canvas" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isExporting ? '打包中 Exporting...' : '导出所选数据 Export' }}</span>
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
import { useClothingStore } from '../../store/clothingStore'
import { usePropsStore } from '../../store/propsStore'
import { useMakeupStore } from '../../store/makeupStore'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['update:isOpen', 'success'])

const planStore = usePlanStore()
const modelStore = useModelStore()
const locationStore = useLocationStore()
const clothingStore = useClothingStore()
const propsStore = usePropsStore()
const makeupStore = useMakeupStore()

const tabs = [
  { id: 'plans', label: '策划方案' },
  { id: 'models', label: '模特库' },
  { id: 'locations', label: '场地库' },
  { id: 'clothing', label: '服装搭配' },
  { id: 'props', label: '道具中心' },
  { id: 'makeup', label: '妆容造型' }
]

const activeTab = ref('plans')
const isExporting = ref(false)

// 选中状态集合
const selections = reactive({
  plans: {},
  models: {},
  locations: {},
  clothing: {},
  props: {},
  makeup: {}
})

const searchQuery = ref('')

// 实时响应式多分类模糊检索过滤
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
    if (activeTab.value === 'clothing' || activeTab.value === 'props' || activeTab.value === 'makeup') {
      return item.name?.toLowerCase().includes(query) || 
        item.description?.toLowerCase().includes(query) ||
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
    selections.clothing = {}
    selections.props = {}
    selections.makeup = {}
    await Promise.all([
      planStore.fetchPlans(),
      modelStore.fetchAll(),
      locationStore.fetchAll(),
      clothingStore.fetchAll(),
      propsStore.fetchAll(),
      makeupStore.fetchAll()
    ])
  }
})

const getList = (tabId) => {
  if (tabId === 'plans') return planStore.plans
  if (tabId === 'models') return modelStore.models
  if (tabId === 'locations') return locationStore.locations
  if (tabId === 'clothing') return clothingStore.clothings
  if (tabId === 'props') return propsStore.propsList
  if (tabId === 'makeup') return makeupStore.makeups
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
  } else if (tabId === 'clothing' || tabId === 'props' || tabId === 'makeup') {
    if (item.images && item.images.length > 0) {
      const firstImg = item.images[0]
      path = typeof firstImg === 'string' ? firstImg : (firstImg.path || firstImg.url)
    }
  }
  
  if (!path) return ''
  if (path.startsWith('local-image://')) return path
  return window.electronAPI.imageToURL(path)
}

const getName = (tabId, item) => {
  if (tabId === 'plans') return item.title || '未命名'
  if (tabId === 'models') return item.name || '未命名'
  if (tabId === 'locations') return item.name || '未命名'
  if (tabId === 'clothing') return item.name || '未命名'
  if (tabId === 'props') return item.name || '未命名'
  if (tabId === 'makeup') return item.name || '未命名'
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
    locations: Object.values(selections.locations).filter(Boolean).length,
    clothing: Object.values(selections.clothing).filter(Boolean).length,
    props: Object.values(selections.props).filter(Boolean).length,
    makeup: Object.values(selections.makeup).filter(Boolean).length
  }
})

const totalSelected = computed(() => {
  return selectedCounts.value.plans + 
    selectedCounts.value.models + 
    selectedCounts.value.locations +
    selectedCounts.value.clothing + 
    selectedCounts.value.props + 
    selectedCounts.value.makeup
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
      locationIds: Object.keys(selections.locations).filter(id => selections.locations[id]).map(Number),
      clothingIds: Object.keys(selections.clothing).filter(id => selections.clothing[id]).map(Number),
      propsIds: Object.keys(selections.props).filter(id => selections.props[id]).map(Number),
      makeupIds: Object.keys(selections.makeup).filter(id => selections.makeup[id]).map(Number)
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
