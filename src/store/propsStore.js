import { defineStore } from 'pinia'

/**
 * 道具库状态管理 — 通过 IPC 与主进程 SQLite 交互
 */
export const usePropsStore = defineStore('props', {
  state: () => ({
    propsList: [],
    loading: false
  }),
  actions: {
    /** 从数据库拉取所有道具 */
    async fetchAll() {
      this.loading = true
      try {
        const result = await window.electronAPI.getProps()
        this.propsList = result.map(p => ({
          ...p,
          tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : (p.tags || []),
          images: typeof p.images_json === 'string' ? JSON.parse(p.images_json) : (p.images_json || [])
        }))
      } catch (e) {
        console.error('[propsStore] 获取道具列表失败:', e)
      } finally {
        this.loading = false
      }
    },

    /** 新建道具 */
    async create(data) {
      try {
        const prepared = {
          name: data.name || '未命名道具',
          description: data.description || '',
          tags: JSON.stringify(data.tags || []),
          link: data.link || '',
          price: data.price || '',
          images_json: JSON.stringify(data.images || [])
        }
        const record = await window.electronAPI.createProp(prepared)
        await this.fetchAll() 
        return record
      } catch (e) {
        console.error('[propsStore] 新建道具失败:', e)
        throw e
      }
    },

    /** 更新道具 */
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
        
        await window.electronAPI.updateProp(id, prepared)
        await this.fetchAll()
      } catch (e) {
        console.error('[propsStore] 更新道具失败:', e)
        throw e
      }
    },

    /** 删除道具 */
    async remove(id) {
      try {
        await window.electronAPI.deleteProp(id)
        await this.fetchAll()
      } catch (e) {
        console.error('[propsStore] 删除道具失败:', e)
      }
    },

    /** 批量删除道具 */
    async removeBatch(ids) {
      try {
        await window.electronAPI.deletePropsBatch(ids)
        await this.fetchAll()
      } catch (e) {
        console.error('[propsStore] 批量删除道具失败:', e)
      }
    }
  }
})
