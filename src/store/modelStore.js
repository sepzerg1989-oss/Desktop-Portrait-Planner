import { defineStore } from 'pinia'

/**
 * 模特库状态管理 — 通过 IPC 与主进程 SQLite 交互
 */
export const useModelStore = defineStore('model', {
  state: () => ({
    models: [],
    loading: false,
  }),
  actions: {
    /** 从数据库拉取所有模特 */
    async fetchAll() {
      this.loading = true
      try {
        const result = await window.electronAPI.getModels()
        // 解析 tags 和 images_json 字段，统一前端字段名为 images
        this.models = result.map(m => ({
          ...m,
          tags: typeof m.tags === 'string' ? JSON.parse(m.tags) : (m.tags || []),
          images: typeof m.images_json === 'string' ? JSON.parse(m.images_json) : (m.images_json || [])
        }))
      } catch (e) {
        console.error('[modelStore] 获取模特列表失败:', e)
      } finally {
        this.loading = false
      }
    },

    /** 新建模特 */
    async create(data) {
      try {
        const prepared = {
          name: data.name || '未命名模特',
          tags: JSON.stringify(data.tags || []),
          avatar_path: data.avatar_path || '',
          model_card_path: data.model_card_path || '',
          social: data.social || '',
          region: data.region || '',
          price: data.price || '',
          // 统一映射：UI 传入 images -> 数据库存入 images_json
          images_json: JSON.stringify(data.images || [])
        }
        const record = await window.electronAPI.createModel(prepared)
        await this.fetchAll() 
        return record
      } catch (e) {
        console.error('[modelStore] 新建模特失败:', e)
        throw e
      }
    },

    /** 更新模特 */
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
        
        // 避免误传 photos 字段
        if (prepared.photos) delete prepared.photos

        await window.electronAPI.updateModel(id, prepared)
        await this.fetchAll()
      } catch (e) {
        console.error('[modelStore] 更新模特失败:', e)
        throw e
      }
    },

    /** 删除模特 */
    async remove(id) {
      try {
        await window.electronAPI.deleteModel(id)
        await this.fetchAll()
      } catch (e) {
        console.error('[modelStore] 删除模特失败:', e)
      }
    },

    /** 批量删除模特 */
    async removeBatch(ids) {
      try {
        await window.electronAPI.deleteModelsBatch(ids)
        await this.fetchAll()
      } catch (e) {
        console.error('[modelStore] 批量删除模特失败:', e)
      }
    },
  },
})
