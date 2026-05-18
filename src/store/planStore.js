import { defineStore } from 'pinia'

/**
 * 策划案状态管理 — 核心三栏联动数据中心
 * 从 Mock 数据迁移至 SQLite 持久化
 */
export const usePlanStore = defineStore('plan', {
  state: () => ({
    // 策划案列表（大厅使用）
    plans: [],
    // 当前编辑中的策划案
    planId: null,
    planTitle: '未命名策划案',
    modules: [],
    activeModuleId: null,
    // 初始文件夹名称（用于检测改名同步）
    initialFolderName: '',
    // 模板列表
    templates: [],
    loading: false,
  }),
  actions: {
    // ==================== 策划案列表（大厅页） ====================

    /** 拉取所有策划案列表 */
    async fetchPlans() {
      this.loading = true
      try {
        this.plans = await window.electronAPI.getPlans()
      } catch (e) {
        console.error('[planStore] 获取策划案列表失败:', e)
      } finally {
        this.loading = false
      }
    },

    /** 新建空策划案并返回记录 */
    async createPlan(title = '未命名策划案') {
      try {
        const record = await window.electronAPI.createPlan(title)
        await this.fetchPlans()
        return record
      } catch (e) {
        console.error('[planStore] 新建策划案失败:', e)
      }
    },

    /** 从模板新建策划案 */
    async createPlanFromTemplate(title, templateId) {
      try {
        const record = await window.electronAPI.createPlanFromTemplate(title, templateId)
        await this.fetchPlans()
        return record
      } catch (e) {
        console.error('[planStore] 从模板新建失败:', e)
      }
    },

    /** 删除策划案 */
    async deletePlan(id) {
      try {
        await window.electronAPI.deletePlan(id)
        await this.fetchPlans()
      } catch (e) {
        console.error('[planStore] 删除策划案失败:', e)
      }
    },

    // ==================== 当前编辑中的策划案 ====================

    /** 加载指定策划案到编辑器 */
    async loadPlan(id) {
      try {
        const record = await window.electronAPI.getPlanById(id)
        if (record) {
          this.planId = record.id
          this.planTitle = record.title
          
          const sanitize = (name) => (name || '').replace(/[\\\/:\*\?"<>\|]/g, '_').trim() || 'unnamed'
          this.initialFolderName = `${sanitize(record.title)}_${record.id}`

          this.modules = typeof record.modules_json === 'string'
            ? JSON.parse(record.modules_json)
            : (record.modules_json || [])
          this.activeModuleId = this.modules.length > 0 ? this.modules[0].id : null
        }
      } catch (e) {
        console.error('[planStore] 加载策划案失败:', e)
      }
    },

    /** 保存当前策划案到数据库 */
    async savePlan() {
      if (!this.planId) return
      try {
        await window.electronAPI.savePlan(this.planId, {
          title: this.planTitle,
          modules_json: JSON.stringify(this.modules),
        })
        // 同时刷新列表（大厅可能需要最新封面/标题）
        await this.fetchPlans()
      } catch (e) {
        console.error('[planStore] 保存策划案失败:', e)
      }
    },

    // ==================== 模块操作（与之前一致） ====================

    setActiveModule(id) {
      this.activeModuleId = id
    },

    updateModules(newModules) {
      this.modules = newModules
    },

    updateActiveModuleData(data) {
      const idx = this.modules.findIndex(m => m.id === this.activeModuleId)
      if (idx !== -1) {
        this.modules[idx].data = { ...this.modules[idx].data, ...data }
        
        // 如果是主题模块且修改了名称，同步更新策划案的总标题
        if (this.modules[idx].type === 'theme' && data.title !== undefined) {
          this.planTitle = data.title
        }
      }
    },

    updateModuleTitle(id, title) {
      const idx = this.modules.findIndex(m => m.id === id)
      if (idx !== -1) {
        this.modules[idx].title = title
      }
    },

    addModule(type) {
      const id = 'm' + Date.now()
      const typeMap = {
        theme: { title: '拍摄主题', data: { title: '', description: '', images: [] } },
        model: { title: '拍摄模特', data: { name: '', avatar: '', tags: [] } },
        location: { title: '拍摄场地', data: { name: '', address: '', images: [] } },
        reference: { title: '参考样片', data: { images: [] } },
        shoot_time: { title: '拍摄日期', data: { date: '', startTime: '', endTime: '', showSunTimes: false, province: '', city: '', lat: null, lng: null } },
        clothing: { title: '模特服装', data: { description: '', images: [] } },
        props: { title: '拍摄道具', data: { description: '', images: [] } },
        custom: { title: '自定义模块', data: { description: '', images: [] } }
      }

      const newModule = {
        id,
        type,
        title: typeMap[type]?.title || '新模块',
        data: typeMap[type]?.data || {}
      }

      this.modules.push(newModule)
      this.setActiveModule(id)
    },

    removeModule(id) {
      const idx = this.modules.findIndex(m => m.id === id)
      if (idx !== -1) {
        this.modules.splice(idx, 1)
        if (this.activeModuleId === id) {
          this.activeModuleId = this.modules.length > 0 ? this.modules[0].id : null
        }
      }
    },

    // ==================== 模板操作（迁移自 localStorage → SQLite） ====================

    /** 保存为模板 */
    async saveAsTemplate(name) {
      try {
        const structure = this.modules.map(m => ({ type: m.type, title: m.title }))
        await window.electronAPI.saveTemplate(name, structure)
        await this.fetchTemplates()
      } catch (e) {
        console.error('[planStore] 保存模板失败:', e)
      }
    },

    /** 获取所有模板 */
    async fetchTemplates() {
      try {
        this.templates = await window.electronAPI.getTemplates()
      } catch (e) {
        console.error('[planStore] 获取模板列表失败:', e)
      }
    },

    /** 删除模板 */
    async deleteTemplate(id) {
      try {
        await window.electronAPI.deleteTemplate(id)
        await this.fetchTemplates()
      } catch (e) {
        console.error('[planStore] 删除模板失败:', e)
      }
    },
  },
  getters: {
    activeModule: (state) => state.modules.find(m => m.id === state.activeModuleId)
  }
})
