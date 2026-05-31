import { defineStore } from 'pinia'

/**
 * 妆容库状态管理 — 通过 IPC 与主进程 SQLite 交互
 */
export const useMakeupStore = defineStore('makeup', {
  state: () => ({
    makeups: [],
    loading: false
  }),
  actions: {
    /** 从数据库拉取所有妆容 */
    async fetchAll() {
      this.loading = true
      try {
        const result = await window.electronAPI.getMakeups()
        this.makeups = result.map(m => ({
          ...m,
          tags: typeof m.tags === 'string' ? JSON.parse(m.tags) : (m.tags || []),
          images: typeof m.images_json === 'string' ? JSON.parse(m.images_json) : (m.images_json || [])
        }))
      } catch (e) {
        console.error('[makeupStore] 获取妆容列表失败:', e)
      } finally {
        this.loading = false
      }
    },

    /** 新建妆容 */
    async create(data) {
      try {
        const prepared = {
          name: data.name || '未命名妆容',
          description: data.description || '',
          tags: JSON.stringify(data.tags || []),
          images_json: JSON.stringify(data.images || [])
        }
        const record = await window.electronAPI.createMakeup(prepared)
        await this.fetchAll() 
        return record
      } catch (e) {
        console.error('[makeupStore] 新建妆容失败:', e)
        throw e
      }
    },

    /** 更新妆容 */
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
        
        await window.electronAPI.updateMakeup(id, prepared)
        await this.fetchAll()
      } catch (e) {
        console.error('[makeupStore] 更新妆容失败:', e)
        throw e
      }
    },

    /** 删除妆容 */
    async remove(id) {
      try {
        await window.electronAPI.deleteMakeup(id)
        await this.fetchAll()
      } catch (e) {
        console.error('[makeupStore] 删除妆容失败:', e)
      }
    },

    /** 批量删除妆容 */
    async removeBatch(ids) {
      try {
        await window.electronAPI.deleteMakeupsBatch(ids)
        await this.fetchAll()
      } catch (e) {
        console.error('[makeupStore] 批量删除妆容失败:', e)
      }
    }
  }
})
