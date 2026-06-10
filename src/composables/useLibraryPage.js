import { ref, computed } from 'vue'
import { sanitize, parseNumericPrice } from '../utils/helpers'

/**
 * 素材库页面通用逻辑 composable
 * 封装 Models/Clothing/Props/Makeup/Locations 五个页面的重复代码
 *
 * @param {Object} options - 配置项
 * @param {Object} options.store - Pinia store 实例
 * @param {Function} options.storeItems - 获取 store 数据列表的 getter
 * @param {string} options.entityLabel - 单个实体名称（如 '模特'）
 * @param {Array} options.sortOptions - 排序选项列表
 * @param {string} options.folderPrefix - 新建临时文件夹前缀（如 'new_model_'）
 * @param {string} options.categoryPath - 资源类别路径（如 'models'）
 * @param {Function} options.onRefresh - 刷新图片回调
 * @param {Object} [options.filters] - 额外过滤/排序定制
 */
export function useLibraryPage(options) {
  const {
    store,
    storeItems,
    entityLabel,
    sortOptions,
    folderPrefix,
    categoryPath,
    onRefresh,
    filters = {}
  } = options

  const searchQuery = ref('')
  const selectedTags = ref([])
  const isManageMode = ref(false)
  const selectedIds = ref([])
  const selectedSort = ref('recently_added')
  const isConfirmOpen = ref(false)
  const confirmMessage = ref('')
  const showNamePrompt = ref(false)
  const promptName = ref('')
  const isDrawerOpen = ref(false)
  const drawerMode = ref('view')
  const editingId = ref(null)
  const tempId = ref(null)
  const previewUrl = ref(null)
  const initialFolderName = ref('')

  const allTags = computed(() => {
    const items = storeItems()
    const tags = items.flatMap(item => item.tags || []).filter(Boolean)
    return [...new Set(tags)]
  })

  const parseItemMatch = (item, query) => {
    return item.name.toLowerCase().includes(query) ||
      (item.description || '').toLowerCase().includes(query) ||
      item.tags.some(t => t.toLowerCase().includes(query))
  }

  const applySort = (list) => {
    list.sort((a, b) => {
      if (selectedSort.value === 'recently_added') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (selectedSort.value === 'name_pinyin') {
        return (a.name || '').localeCompare(b.name || '', 'zh-CN')
      }
      if (selectedSort.value === 'price_asc') {
        const pA = parseNumericPrice(a.price)
        const pB = parseNumericPrice(b.price)
        if (pA === 0 && pB > 0) return 1
        if (pB === 0 && pA > 0) return -1
        return pA - pB
      }
      if (selectedSort.value === 'price_desc') {
        const pA = parseNumericPrice(a.price)
        const pB = parseNumericPrice(b.price)
        if (pA === 0 && pB > 0) return 1
        if (pB === 0 && pA > 0) return -1
        return pB - pA
      }
      return 0
    })
    return list
  }

  const filteredItems = computed(() => {
    let list = storeItems().filter(item => {
      const query = searchQuery.value.trim().toLowerCase()
      const matchesSearch = !query || parseItemMatch(item, query)
      const matchesTags = selectedTags.value.length === 0 ||
        selectedTags.value.some(t => item.tags.includes(t))
      return matchesSearch && matchesTags
    })
    return applySort(list.slice())
  })

  const isAllSelected = computed(() => {
    if (filteredItems.value.length === 0) return false
    return filteredItems.value.every(item => selectedIds.value.includes(item.id))
  })

  const resetFilters = () => {
    searchQuery.value = ''
    selectedTags.value = []
    selectedSort.value = 'recently_added'
  }

  const handleCardClick = (item) => {
    if (isManageMode.value) {
      const idx = selectedIds.value.indexOf(item.id)
      if (idx === -1) {
        selectedIds.value.push(item.id)
      } else {
        selectedIds.value.splice(idx, 1)
      }
    } else {
      openViewDrawer(item)
    }
  }

  const toggleAll = () => {
    if (isAllSelected.value) {
      selectedIds.value = selectedIds.value.filter(id =>
        !filteredItems.value.some(item => item.id === id)
      )
    } else {
      filteredItems.value.forEach(item => {
        if (!selectedIds.value.includes(item.id)) {
          selectedIds.value.push(item.id)
        }
      })
    }
  }

  const executeBatchDelete = () => {
    if (selectedIds.value.length === 0) return
    confirmMessage.value = `确定要批量删除选中的 ${selectedIds.value.length} 个${entityLabel}吗？此操作将永久物理删除所有选定${entityLabel}相册，且无法撤销！`
    isConfirmOpen.value = true
  }

  const cancelManageMode = () => {
    isManageMode.value = false
    selectedIds.value = []
  }

  const openCreateDrawer = () => {
    promptName.value = ''
    showNamePrompt.value = true
  }

  const confirmNamePrompt = (resetFormFn) => {
    let finalName = promptName.value.trim()
    if (!finalName) {
      finalName = `未命名${entityLabel}`
    }
    drawerMode.value = 'edit'
    editingId.value = null
    tempId.value = Date.now()
    initialFolderName.value = `${sanitize(finalName)}_${tempId.value}`
    if (resetFormFn) resetFormFn()
    promptName.value = finalName
    showNamePrompt.value = false
    isDrawerOpen.value = true
  }

  const cancelNamePrompt = () => {
    showNamePrompt.value = false
  }

  const openViewDrawer = (item) => {
    editingId.value = item.id
    initialFolderName.value = `${sanitize(item.name)}_${item.id}`
    drawerMode.value = 'view'
    isDrawerOpen.value = true
  }

  const getFolderName = () => {
    if (initialFolderName.value && !initialFolderName.value.startsWith(folderPrefix)) {
      return initialFolderName.value
    }
    const base = editingId.value || tempId.value
    const name = sanitize(initialFolderName.value ? promptName.value : entityLabel)
    const newName = name === 'unnamed' ? `${folderPrefix}${base}` : `${name}_${base}`
    initialFolderName.value = newName
    return newName
  }

  const uploadCategory = computed(() => `${categoryPath}/${getFolderName()}`)

  const executeBatchDeleteAction = async () => {
    try {
      const cleanIds = JSON.parse(JSON.stringify(selectedIds.value))
      await store.removeBatch(cleanIds)
      selectedIds.value = []
      isManageMode.value = false
      await onRefresh()
    } catch (e) {
      alert("批量删除失败: " + e.message)
      console.error(e)
    } finally {
      isConfirmOpen.value = false
    }
  }

  const executeSingleDeleteAction = async (item) => {
    try {
      await store.remove(item.id)
      await onRefresh()
    } catch (e) {
      alert("删除失败: " + e.message)
      console.error(e)
    } finally {
      isConfirmOpen.value = false
      isDrawerOpen.value = false
    }
  }

  const closeDrawer = async (cleanupFn) => {
    if (drawerMode.value === 'edit' && !editingId.value && tempId.value) {
      await window.electronAPI.cleanupTempFolder(`${categoryPath}/${initialFolderName.value}`)
    }
    if (cleanupFn) cleanupFn()
    isDrawerOpen.value = false
  }

  const preview = (url) => { previewUrl.value = url }
  const closePreview = () => { previewUrl.value = null }

  return {
    searchQuery,
    selectedTags,
    isManageMode,
    selectedIds,
    selectedSort,
    isConfirmOpen,
    confirmMessage,
    showNamePrompt,
    promptName,
    isDrawerOpen,
    drawerMode,
    editingId,
    tempId,
    previewUrl,
    initialFolderName,
    allTags,
    filteredItems,
    isAllSelected,
    uploadCategory,
    resetFilters,
    handleCardClick,
    toggleAll,
    executeBatchDelete,
    cancelManageMode,
    openCreateDrawer,
    confirmNamePrompt,
    cancelNamePrompt,
    openViewDrawer,
    getFolderName,
    executeBatchDeleteAction,
    executeSingleDeleteAction,
    closeDrawer,
    preview,
    closePreview,
  }
}