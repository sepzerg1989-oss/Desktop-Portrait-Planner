import { defineStore } from 'pinia'

/**
 * 服装搭配库状态管理 — 通过 IPC 与主进程 SQLite 交互
 */
export const useClothingStore = defineStore('clothing', {
  state: () => ({
    clothings: [],
    loading: false
  }),
  actions: {
    /** 从数据库拉取所有服装搭配 */
    async fetchAll() {
      this.loading = true
      try {
        const result = await window.electronAPI.getClothings()
        this.clothings = result.map(c => ({
          ...c,
          tags: typeof c.tags === 'string' ? JSON.parse(c.tags) : (c.tags || []),
          images: typeof c.images_json === 'string' ? JSON.parse(c.images_json) : (c.images_json || [])
        }))
      } catch (e) {
        console.error('[clothingStore] 获取服装搭配列表失败:', e)
        throw e
      } finally {
        this.loading = false
      }
    },

    /** 新建服装搭配 */
    async create(data) {
      try {
        const prepared = {
          name: data.name || '未命名服装搭配',
          description: data.description || '',
          tags: JSON.stringify(data.tags || []),
          link: data.link || '',
          price: data.price || '',
          images_json: JSON.stringify(data.images || [])
        }
        const record = await window.electronAPI.createClothing(prepared)
        await this.fetchAll() 
        return record
      } catch (e) {
        console.error('[clothingStore] 新建服装搭配失败:', e)
        throw e
      }
    },

    /** 更新服装搭配 */
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
        
        await window.electronAPI.updateClothing(id, prepared)
        await this.fetchAll()
      } catch (e) {
        console.error('[clothingStore] 更新服装搭配失败:', e)
        throw e
      }
    },

    /** 删除服装搭配 */
    async remove(id) {
      try {
        await window.electronAPI.deleteClothing(id)
        await this.fetchAll()
      } catch (e) {
        console.error('[clothingStore] 删除服装搭配失败:', e)
        throw e
      }
    },

    /** 批量删除服装搭配 */
    async removeBatch(ids) {
      try {
        await window.electronAPI.deleteClothingsBatch(ids)
        await this.fetchAll()
      } catch (e) {
        console.error('[clothingStore] 批量删除服装搭配失败:', e)
        throw e
      }
    }
  }
})
