import { defineStore } from 'pinia'

/**
 * 场地库状态管理 — 通过 IPC 与主进程 SQLite 交互
 */
export const useLocationStore = defineStore('location', {
  state: () => ({
    locations: [],
    loading: false,
  }),
  actions: {
    /** 从数据库拉取所有场地 */
    async fetchAll() {
      this.loading = true
      try {
        const result = await window.electronAPI.getLocations()
        // 解析 JSON 字段
        this.locations = result.map(loc => ({
          ...loc,
          tags: typeof loc.tags === 'string' ? JSON.parse(loc.tags) : (loc.tags || []),
          images: typeof loc.images_json === 'string' ? JSON.parse(loc.images_json) : (loc.images_json || []),
        }))
      } catch (e) {
        console.error('[locationStore] 获取场地列表失败:', e)
      } finally {
        this.loading = false
      }
    },

    /** 新建场地 */
    async create(data) {
      try {
        const prepared = {
          name: data.name || '未命名场地',
          address: data.address || '',
          price: data.price || '',
          tags: JSON.stringify(data.tags || []),
          cover_path: data.cover_path || '',
          // 统一映射：UI 传入 images -> 数据库存入 images_json
          images_json: JSON.stringify(data.images || []),
        }
        const record = await window.electronAPI.createLocation(prepared)
        await this.fetchAll()
        return record
      } catch (e) {
        console.error('[locationStore] 新建场地失败:', e)
        throw e
      }
    },

    /** 更新场地 */
    async update(id, data) {
      try {
        const prepared = { ...data }
        
        // 自动处理数组转 JSON 字符串
        if (Array.isArray(prepared.tags)) {
          prepared.tags = JSON.stringify(prepared.tags)
        }
        
        // 统一映射：UI 传入 images -> 数据库存入 images_json
        if (Array.isArray(prepared.images)) {
          prepared.images_json = JSON.stringify(prepared.images)
          delete prepared.images
        }

        await window.electronAPI.updateLocation(id, prepared)
        await this.fetchAll()
      } catch (e) {
        console.error('[locationStore] 更新场地失败:', e)
        throw e
      }
    },

    /** 删除场地 */
    async remove(id) {
      try {
        await window.electronAPI.deleteLocation(id)
        await this.fetchAll()
      } catch (e) {
        console.error('[locationStore] 删除场地失败:', e)
      }
    },

    /** 批量删除场地 */
    async removeBatch(ids) {
      try {
        await window.electronAPI.deleteLocationsBatch(ids)
        await this.fetchAll()
      } catch (e) {
        console.error('[locationStore] 批量删除场地失败:', e)
      }
    },
  },
})
