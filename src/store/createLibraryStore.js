import { defineStore } from 'pinia'

/**
 * 通用素材库 Store 工厂函数
 * 消除 clothingStore/makeupStore/propsStore/locationStore/modelStore 的重复代码
 *
 * @param {string} storeId - Pinia store 唯一标识
 * @param {object} options
 * @param {string} options.apiPrefix - electronAPI 方法名前缀 (如 'Clothing' -> getClothings/createClothing/...)
 * @param {string} options.itemsKey - store state 中列表的 key 名称 (如 'clothings', 'models')
 * @param {string} options.defaultName - 新建时的默认名称
 * @param {Array<string>} [options.extraFields] - create 时额外的字段名
 */
export function createLibraryStore(storeId, options) {
  const {
    apiPrefix,
    itemsKey,
    defaultName = '未命名',
    extraFields = []
  } = options

  const getMethodName = (action) => {
    // 特殊处理：getAll 对大部分实体是 get + 复数形式
    if (action === 'getAll') {
      // Clothing -> getClothings, Model -> getModels, Makeup -> getMakeups
      if (apiPrefix === 'Clothing') return 'getClothings'
      if (apiPrefix === 'Prop') return 'getProps'
      if (apiPrefix === 'Makeup') return 'getMakeups'
      return `get${apiPrefix}s`
    }
    return `${action}${apiPrefix}`
  }

  const deleteMethodName = (action) => {
    if (action === 'delete') {
      return `delete${apiPrefix}`
    }
    // deleteBatch
    if (apiPrefix === 'Clothing') return 'deleteClothingsBatch'
    if (apiPrefix === 'Prop') return 'deletePropsBatch'
    if (apiPrefix === 'Makeup') return 'deleteMakeupsBatch'
    return `delete${apiPrefix}sBatch`
  }

  return defineStore(storeId, {
    state: () => ({
      [itemsKey]: [],
      loading: false
    }),
    actions: {
      async fetchAll() {
        this.loading = true
        try {
          const result = await window.electronAPI[getMethodName('getAll')]()
          const parsed = result.map(item => ({
            ...item,
            tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : (item.tags || []),
            images: typeof item.images_json === 'string' ? JSON.parse(item.images_json) : (item.images_json || [])
          }))
          this[itemsKey] = parsed
        } catch (e) {
          console.error(`[${storeId}] 获取列表失败:`, e)
          throw e
        } finally {
          this.loading = false
        }
      },

      async create(data) {
        try {
          const prepared = {
            name: data.name || defaultName,
            tags: JSON.stringify(data.tags || []),
            images_json: JSON.stringify(data.images || [])
          }
          for (const field of extraFields) {
            prepared[field] = data[field] || ''
          }
          const record = await window.electronAPI[getMethodName('create')](prepared)
          await this.fetchAll()
          return record
        } catch (e) {
          console.error(`[${storeId}] 新建失败:`, e)
          throw e
        }
      },

      async update(id, data) {
        try {
          const prepared = { ...data }
          if (Array.isArray(prepared.tags)) {
            prepared.tags = JSON.stringify(prepared.tags)
          }
          if (Array.isArray(prepared.images)) {
            prepared.images_json = JSON.stringify(prepared.images)
            delete prepared.images
          }
          if (prepared.photos) delete prepared.photos
          await window.electronAPI[getMethodName('update')](id, prepared)
          await this.fetchAll()
        } catch (e) {
          console.error(`[${storeId}] 更新失败:`, e)
          throw e
        }
      },

      async remove(id) {
        try {
          await window.electronAPI[deleteMethodName('delete')](id)
          await this.fetchAll()
        } catch (e) {
          console.error(`[${storeId}] 删除失败:`, e)
          throw e
        }
      },

      async removeBatch(ids) {
        try {
          const finalIds = JSON.parse(JSON.stringify(ids))
          await window.electronAPI[deleteMethodName('deleteBatch')](finalIds)
          await this.fetchAll()
        } catch (e) {
          console.error(`[${storeId}] 批量删除失败:`, e)
          throw e
        }
      }
    }
  })
}