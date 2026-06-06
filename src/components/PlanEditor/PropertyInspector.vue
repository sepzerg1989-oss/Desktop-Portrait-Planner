<template>
  <div 
    class="h-full w-full bg-morandi-panel flex flex-col relative outline-none animate-in fade-in duration-200" 
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

    <div class="flex-1 overflow-y-auto p-6 scroll-thin">
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

        <ClothingInspector 
          v-else-if="activeModule.type === 'clothing'" 
          :form-data="formData" 
          :category="category" 
          @toggle-library="toggleClothingLibrary"
          @save-library="saveClothingToLibrary"
        />

        <PropsInspector 
          v-else-if="activeModule.type === 'props'" 
          :form-data="formData" 
          :category="category" 
          @toggle-library="togglePropsLibrary"
          @save-library="savePropToLibrary"
        />

        <MakeupInspector 
          v-else-if="activeModule.type === 'makeup'" 
          :form-data="formData" 
          :category="category" 
          @toggle-library="toggleMakeupLibrary"
          @save-library="saveMakeupToLibrary"
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

    <!-- 服装搭配库选择弹窗 -->
    <ClothingLibraryModal 
      :show="showClothingLibrary" 
      @close="showClothingLibrary = false" 
      @import="importClothing" 
    />

    <!-- 道具中心选择弹窗 -->
    <PropsLibraryModal 
      :show="showPropsLibrary" 
      @close="showPropsLibrary = false" 
      @import="importProp" 
    />

    <!-- 妆容造型选择弹窗 -->
    <MakeupLibraryModal 
      :show="showMakeupLibrary" 
      @close="showMakeupLibrary = false" 
      @import="importMakeup" 
    />

    <!-- 快捷命名弹窗 (针对存入素材库) -->
    <MorandiModal
      :show="savePrompt.show"
      :title="savePrompt.title"
      :message="savePrompt.label"
      sub-title="Quick Save"
      type="prompt"
      :input-value="savePrompt.value"
      cancel-text="取消 / Cancel"
      confirm-text="确认 / Confirm"
      :on-confirm="handleSavePromptConfirm"
      :on-cancel="handleSavePromptCancel"
      @update:show="savePrompt.show = $event"
    />
  </div>
</template>

<script setup>
import { computed, watch, ref, reactive } from 'vue'
import { usePlanStore } from '../../store/planStore'
import { useModelStore } from '../../store/modelStore'
import { useLocationStore } from '../../store/locationStore'
import { useClothingStore } from '../../store/clothingStore'
import { usePropsStore } from '../../store/propsStore'
import { useMakeupStore } from '../../store/makeupStore'
import { sanitize } from '../../utils/helpers'

import ThemeInspector from './Inspectors/ThemeInspector.vue'
import ModelInspector from './Inspectors/ModelInspector.vue'
import LocationInspector from './Inspectors/LocationInspector.vue'
import ClothingInspector from './Inspectors/ClothingInspector.vue'
import PropsInspector from './Inspectors/PropsInspector.vue'
import MakeupInspector from './Inspectors/MakeupInspector.vue'
import TimeInspector from './Inspectors/TimeInspector.vue'
import GenericInspector from './Inspectors/GenericInspector.vue'

import ModelLibraryModal from './ModelLibraryModal.vue'
import LocationLibraryModal from './LocationLibraryModal.vue'
import ClothingLibraryModal from './ClothingLibraryModal.vue'
import PropsLibraryModal from './PropsLibraryModal.vue'
import MakeupLibraryModal from './MakeupLibraryModal.vue'
import MorandiModal from '../common/MorandiModal.vue'

const emit = defineEmits(['notify'])

const store = usePlanStore()
const modelStore = useModelStore()
const locationStore = useLocationStore()
const clothingStore = useClothingStore()
const propsStore = usePropsStore()
const makeupStore = useMakeupStore()

const activeModule = computed(() => store.activeModule)

const showModelLibrary = ref(false)
const showLocationLibrary = ref(false)
const showClothingLibrary = ref(false)
const showPropsLibrary = ref(false)
const showMakeupLibrary = ref(false)

// 图片存放目录
const category = computed(() => `plans/${sanitize(store.planTitle)}_${store.planId}`)

// 双向绑定表单数据
const formData = ref({})

// 当选中不同模块时，重置表单数据
watch(activeModule, (newVal, oldVal) => {
  if (newVal?.id === oldVal?.id && oldVal !== undefined) return

  // 关闭所有的素材库选择弹窗，杜绝数据错位
  showModelLibrary.value = false
  showLocationLibrary.value = false
  showClothingLibrary.value = false
  showPropsLibrary.value = false
  showMakeupLibrary.value = false

  if (newVal) {
    let data = newVal.data ? JSON.parse(JSON.stringify(newVal.data)) : {}
    
    // 平滑升级旧的单图服装/道具数据到新版 items 数组架构
    if (['clothing', 'props'].includes(newVal.type)) {
      if (!data || !data.items) {
        data = {
          items: [
            {
              id: 'item-' + Date.now(),
              name: data?.name || '',
              description: data?.description || '',
              tags: data?.tags || [],
              tagsInput: (data?.tags || []).join(', '),
              price: data?.price || '',
              link: data?.link || '',
              images: data?.images || []
            }
          ]
        }
      } else if (Array.isArray(data.items)) {
        // 确保 items 中的每个项都有 tagsInput
        data.items.forEach(item => {
          if (item && item.tags && item.tagsInput === undefined) {
            item.tagsInput = (item.tags || []).join(', ')
          }
        })
      }
    }

    formData.value = data
    if (['model', 'location', 'makeup'].includes(newVal.type) && newVal.data && newVal.data.tags) {
      formData.value.tagsInput = (newVal.data.tags || []).join(', ')
    }
  } else {
    formData.value = {}
  }
}, { immediate: true })

// 监听外部对当前模块图片数组的直接修改，同步到表单 (服装和道具在子项中管理，无需这个全局监听)
watch(() => activeModule.value?.data?.images, (newImages) => {
  if (activeModule.value && ['clothing', 'props'].includes(activeModule.value.type)) return
  if (newImages && formData.value && formData.value.images) {
    const currentStr = JSON.stringify(formData.value.images)
    const newStr = JSON.stringify(newImages)
    if (currentStr !== newStr) {
      formData.value.images = JSON.parse(newStr)
    }
  }
}, { deep: true })

// 监听外部对当前模块子项数组的直接修改，并实时同步到表单
watch(() => activeModule.value?.data?.items, (newItems) => {
  if (!activeModule.value || !['clothing', 'props'].includes(activeModule.value.type)) return
  if (newItems && formData.value && formData.value.items) {
    const currentStr = JSON.stringify(formData.value.items)
    const newStr = JSON.stringify(newItems)
    if (currentStr !== newStr) {
      const clonedItems = JSON.parse(newStr)
      // 维持标签输入框的暂存值，避免用户输入到一半被覆写或失去焦点
      clonedItems.forEach((item, index) => {
        const currentItem = formData.value.items[index]
        if (currentItem) {
          if (JSON.stringify(currentItem.tags) === JSON.stringify(item.tags)) {
            item.tagsInput = currentItem.tagsInput
          } else {
            item.tagsInput = (item.tags || []).join(', ')
          }
        } else {
          item.tagsInput = (item.tags || []).join(', ')
        }
      })
      formData.value.items = clonedItems
    }
  }
}, { deep: true })

// 当表单数据改变时，同步回 Store (实现双向绑定)
watch(formData, (newVal) => {
  if (newVal && Object.keys(newVal).length > 0) {
    const updatedData = JSON.parse(JSON.stringify(newVal))
    if (activeModule.value && ['clothing', 'props'].includes(activeModule.value.type) && Array.isArray(updatedData.items)) {
      // 循环同步各子项的 tags 列表
      updatedData.items.forEach(item => {
        if (item && item.tagsInput !== undefined) {
          item.tags = item.tagsInput.split(/[,，·]/).map(s => s.trim()).filter(Boolean)
        }
      })
    } else if (updatedData.tagsInput !== undefined) {
      updatedData.tags = updatedData.tagsInput.split(/[,，·]/).map(s => s.trim()).filter(Boolean)
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

  // 复制物理文件到全局 models 目录，以防计划删除导致图片丢失
  const tempFolderName = `${sanitize(formData.value.name)}_${Date.now()}`
  const targetCategory = `models/${tempFolderName}`

  const filePathsToCopy = []
  if (formData.value.avatarPath) filePathsToCopy.push(formData.value.avatarPath)
  if (formData.value.modelCardPath) filePathsToCopy.push(formData.value.modelCardPath)
  if (formData.value.images) {
    formData.value.images.forEach(img => {
      if (img && img.path) filePathsToCopy.push(img.path)
    })
  }

  let finalAvatarPath = formData.value.avatarPath || ''
  let finalModelCardPath = formData.value.modelCardPath || ''
  let finalImages = JSON.parse(JSON.stringify(formData.value.images || []))

  if (filePathsToCopy.length > 0) {
    try {
      const copyResults = await window.electronAPI.copyFilesToEntity(filePathsToCopy, targetCategory)
      const pathMapping = {}
      copyResults.forEach(res => {
        pathMapping[res.oldPath] = res.newPath
      })

      if (finalAvatarPath && pathMapping[finalAvatarPath]) {
        finalAvatarPath = pathMapping[finalAvatarPath]
      }
      if (finalModelCardPath && pathMapping[finalModelCardPath]) {
        finalModelCardPath = pathMapping[finalModelCardPath]
      }
      finalImages.forEach(img => {
        if (img && img.path && pathMapping[img.path]) {
          img.path = pathMapping[img.path]
          img.url = window.electronAPI.imageToURL(img.path)
        }
      })
    } catch (err) {
      console.error('保存并归档模特图片失败:', err)
    }
  }

  const dataToSave = {
    name: formData.value.name,
    region: formData.value.region || '',
    price: formData.value.price || '',
    tags: tags,
    social: '',
    avatar_path: finalAvatarPath,
    model_card_path: finalModelCardPath,
    images: finalImages
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

  // 复制物理文件到全局 locations 目录
  const tempFolderName = `${sanitize(formData.value.name)}_${Date.now()}`
  const targetCategory = `locations/${tempFolderName}`

  const filePathsToCopy = []
  if (formData.value.images) {
    formData.value.images.forEach(img => {
      if (img && img.path) filePathsToCopy.push(img.path)
    })
  }

  let finalImages = JSON.parse(JSON.stringify(formData.value.images || []))
  if (filePathsToCopy.length > 0) {
    try {
      const copyResults = await window.electronAPI.copyFilesToEntity(filePathsToCopy, targetCategory)
      const pathMapping = {}
      copyResults.forEach(res => {
        pathMapping[res.oldPath] = res.newPath
      })

      finalImages.forEach(img => {
        if (img && img.path && pathMapping[img.path]) {
          img.path = pathMapping[img.path]
          img.url = window.electronAPI.imageToURL(img.path)
        }
      })
    } catch (err) {
      console.error('保存并归档场地图片失败:', err)
    }
  }

  const dataToSave = {
    name: formData.value.name,
    address: formData.value.address || '',
    tags: tags,
    images: finalImages
  }

  await locationStore.create(dataToSave)
  emit('notify', { title: '操作成功', message: '已成功存入场地库', type: 'alert' })
}

// ==================== 服装库联动 ====================
const toggleClothingLibrary = async () => {
  if (!showClothingLibrary.value) {
    await clothingStore.fetchAll()
    for (const c of clothingStore.clothings) {
      if (c.images && c.images.length > 0) {
        const firstImg = c.images[0]
        const path = typeof firstImg === 'string' ? firstImg : (firstImg.path || firstImg.url)
        c.coverURL = await window.electronAPI.imageToURL(path)
      }
    }
  }
  showClothingLibrary.value = !showClothingLibrary.value
}

const importClothing = async (item) => {
  const processedImages = []
  if (item.images) {
    for (let img of item.images) {
      const url = typeof img === 'string' ? img : (img.url || img.path)
      if (url && url.startsWith('local-image://')) {
        processedImages.push(img)
      } else if (url) {
        const atomUrl = await window.electronAPI.imageToURL(url)
        processedImages.push({ url: atomUrl, path: url, ratio: img.ratio || 1 })
      }
    }
  }

  // 写入新版本 items 数组中作为追加服装搭配
  if (!formData.value.items) {
    formData.value.items = []
  }
  formData.value.items.push({
    id: 'item-' + Date.now(),
    name: item.name,
    description: item.description || '',
    tags: [...(item.tags || [])],
    tagsInput: (item.tags || []).join(', '),
    price: item.price || '',
    link: item.link || '',
    images: processedImages
  })
  showClothingLibrary.value = false
}

const saveClothingToLibrary = async (item) => {
  const targetItem = item || formData.value
  if (!targetItem.name) {
    showSavePrompt('clothing', targetItem)
    return
  }
  
  const tags = targetItem.tagsInput 
    ? targetItem.tagsInput.split(/[,，·]/).map(s => s.trim()).filter(Boolean)
    : (targetItem.tags || [])

  // 复制物理文件到全局 clothing 目录
  const tempFolderName = `${sanitize(targetItem.name)}_${Date.now()}`
  const targetCategory = `clothing/${tempFolderName}`

  const filePathsToCopy = []
  if (targetItem.images) {
    targetItem.images.forEach(img => {
      if (img && img.path) filePathsToCopy.push(img.path)
    })
  }

  let finalImages = JSON.parse(JSON.stringify(targetItem.images || []))
  if (filePathsToCopy.length > 0) {
    try {
      const copyResults = await window.electronAPI.copyFilesToEntity(filePathsToCopy, targetCategory)
      const pathMapping = {}
      copyResults.forEach(res => {
        pathMapping[res.oldPath] = res.newPath
      })

      finalImages.forEach(img => {
        if (img && img.path && pathMapping[img.path]) {
          img.path = pathMapping[img.path]
          img.url = window.electronAPI.imageToURL(img.path)
        }
      })
    } catch (err) {
      console.error('保存并归档服装图片失败:', err)
    }
  }

  const dataToSave = {
    name: targetItem.name,
    description: targetItem.description || '',
    tags: tags,
    price: targetItem.price || '',
    link: targetItem.link || '',
    images: finalImages
  }

  await clothingStore.create(dataToSave)
  emit('notify', { title: '操作成功', message: '已成功存入服装搭配库', type: 'alert' })
}

// ==================== 道具库联动 ====================
const togglePropsLibrary = async () => {
  if (!showPropsLibrary.value) {
    await propsStore.fetchAll()
    for (const p of propsStore.propsList) {
      if (p.images && p.images.length > 0) {
        const firstImg = p.images[0]
        const path = typeof firstImg === 'string' ? firstImg : (firstImg.path || firstImg.url)
        p.coverURL = await window.electronAPI.imageToURL(path)
      }
    }
  }
  showPropsLibrary.value = !showPropsLibrary.value
}

const importProp = async (item) => {
  const processedImages = []
  if (item.images) {
    for (let img of item.images) {
      const url = typeof img === 'string' ? img : (img.url || img.path)
      if (url && url.startsWith('local-image://')) {
        processedImages.push(img)
      } else if (url) {
        const atomUrl = await window.electronAPI.imageToURL(url)
        processedImages.push({ url: atomUrl, path: url, ratio: img.ratio || 1 })
      }
    }
  }

  // 写入新版本 items 数组中作为追加置景道具
  if (!formData.value.items) {
    formData.value.items = []
  }
  formData.value.items.push({
    id: 'item-' + Date.now(),
    name: item.name,
    description: item.description || '',
    tags: [...(item.tags || [])],
    tagsInput: (item.tags || []).join(', '),
    price: item.price || '',
    link: item.link || '',
    images: processedImages
  })
  showPropsLibrary.value = false
}

const savePropToLibrary = async (item) => {
  const targetItem = item || formData.value
  if (!targetItem.name) {
    showSavePrompt('props', targetItem)
    return
  }

  const tags = targetItem.tagsInput 
    ? targetItem.tagsInput.split(/[,，·]/).map(s => s.trim()).filter(Boolean)
    : (targetItem.tags || [])

  // 复制物理文件到全局 props 目录
  const tempFolderName = `${sanitize(targetItem.name)}_${Date.now()}`
  const targetCategory = `props/${tempFolderName}`

  const filePathsToCopy = []
  if (targetItem.images) {
    targetItem.images.forEach(img => {
      if (img && img.path) filePathsToCopy.push(img.path)
    })
  }

  let finalImages = JSON.parse(JSON.stringify(targetItem.images || []))
  if (filePathsToCopy.length > 0) {
    try {
      const copyResults = await window.electronAPI.copyFilesToEntity(filePathsToCopy, targetCategory)
      const pathMapping = {}
      copyResults.forEach(res => {
        pathMapping[res.oldPath] = res.newPath
      })

      finalImages.forEach(img => {
        if (img && img.path && pathMapping[img.path]) {
          img.path = pathMapping[img.path]
          img.url = window.electronAPI.imageToURL(img.path)
        }
      })
    } catch (err) {
      console.error('保存并归档道具图片失败:', err)
    }
  }

  const dataToSave = {
    name: targetItem.name,
    description: targetItem.description || '',
    tags: tags,
    price: targetItem.price || '',
    link: targetItem.link || '',
    images: finalImages
  }

  await propsStore.create(dataToSave)
  emit('notify', { title: '操作成功', message: '已成功存入置景道具库', type: 'alert' })
}

// ==================== 妆容库联动 ====================
const toggleMakeupLibrary = async () => {
  if (!showMakeupLibrary.value) {
    await makeupStore.fetchAll()
    for (const m of makeupStore.makeups) {
      if (m.images && m.images.length > 0) {
        const firstImg = m.images[0]
        const path = typeof firstImg === 'string' ? firstImg : (firstImg.path || firstImg.url)
        m.coverURL = await window.electronAPI.imageToURL(path)
      }
    }
  }
  showMakeupLibrary.value = !showMakeupLibrary.value
}

const importMakeup = async (makeup) => {
  const processedImages = []
  if (makeup.images) {
    for (let img of makeup.images) {
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
    name: makeup.name,
    description: makeup.description || '',
    tags: [...(makeup.tags || [])],
    tagsInput: (makeup.tags || []).join(', '),
    images: processedImages
  }
  showMakeupLibrary.value = false
}

const saveMakeupToLibrary = async () => {
  if (!formData.value.name) {
    showSavePrompt('makeup')
    return
  }

  const tags = formData.value.tagsInput 
    ? formData.value.tagsInput.split(/[,，]/).map(s => s.trim()).filter(Boolean)
    : (formData.value.tags || [])

  // 复制物理文件到全局 makeup 目录
  const tempFolderName = `${sanitize(formData.value.name)}_${Date.now()}`
  const targetCategory = `makeup/${tempFolderName}`

  const filePathsToCopy = []
  if (formData.value.images) {
    formData.value.images.forEach(img => {
      if (img && img.path) filePathsToCopy.push(img.path)
    })
  }

  let finalImages = JSON.parse(JSON.stringify(formData.value.images || []))
  if (filePathsToCopy.length > 0) {
    try {
      const copyResults = await window.electronAPI.copyFilesToEntity(filePathsToCopy, targetCategory)
      const pathMapping = {}
      copyResults.forEach(res => {
        pathMapping[res.oldPath] = res.newPath
      })

      finalImages.forEach(img => {
        if (img && img.path && pathMapping[img.path]) {
          img.path = pathMapping[img.path]
          img.url = window.electronAPI.imageToURL(img.path)
        }
      })
    } catch (err) {
      console.error('保存并归档妆容图片失败:', err)
    }
  }

  const dataToSave = {
    name: formData.value.name,
    description: formData.value.description || '',
    tags: tags,
    images: finalImages
  }

  await makeupStore.create(dataToSave)
  emit('notify', { title: '操作成功', message: '已成功存入妆面造型库', type: 'alert' })
}

// ==================== 快捷命名弹窗 ====================
const savePrompt = reactive({
  show: false,
  title: '',
  label: '',
  value: '',
  type: '',
  targetItem: null
})

const TYPE_LABELS = {
  model: { title: '保存模特到素材库', label: '请输入模特姓名' },
  location: { title: '保存场地到素材库', label: '请输入场地名称' },
  clothing: { title: '保存服装到素材库', label: '请输入服装搭配名称' },
  props: { title: '保存道具到素材库', label: '请输入道具名称' },
  makeup: { title: '保存妆容到素材库', label: '请输入妆容名称' }
}

const showSavePrompt = (type, item = null) => {
  const labels = TYPE_LABELS[type] || TYPE_LABELS.model
  savePrompt.show = true
  savePrompt.title = labels.title
  savePrompt.label = labels.label
  savePrompt.value = ''
  savePrompt.type = type
  savePrompt.targetItem = item
}

const handleSavePromptCancel = () => {
  savePrompt.show = false
}

const handleSavePromptConfirm = async (inputVal) => {
  if (!inputVal || !inputVal.trim()) return
  
  const nameVal = inputVal.trim()
  const targetType = savePrompt.type
  const targetItem = savePrompt.targetItem
  savePrompt.show = false
  
  if (targetType === 'model') {
    formData.value.name = nameVal
    await saveToLibrary()
  } else if (targetType === 'location') {
    formData.value.name = nameVal
    await saveLocationToLibrary()
  } else if (targetType === 'clothing') {
    if (targetItem) {
      targetItem.name = nameVal
      targetItem.tagsInput = targetItem.tagsInput || ''
      await saveClothingToLibrary(targetItem)
    } else {
      formData.value.name = nameVal
      await saveClothingToLibrary()
    }
  } else if (targetType === 'props') {
    if (targetItem) {
      targetItem.name = nameVal
      targetItem.tagsInput = targetItem.tagsInput || ''
      await savePropToLibrary(targetItem)
    } else {
      formData.value.name = nameVal
      await savePropToLibrary()
    }
  } else if (targetType === 'makeup') {
    formData.value.name = nameVal
    await saveMakeupToLibrary()
  }
}
</script>
