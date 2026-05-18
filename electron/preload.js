const { contextBridge, ipcRenderer, webUtils } = require('electron')

// 暴露类型化的安全 API 给渲染进程 (Vue 页面)
contextBridge.exposeInMainWorld('electronAPI', {

  // ==================== 模特库 CRUD ====================
  getModels: () => ipcRenderer.invoke('db:models:getAll'),
  createModel: (data) => ipcRenderer.invoke('db:models:create', data),
  updateModel: (id, data) => ipcRenderer.invoke('db:models:update', id, data),
  deleteModel: (id) => ipcRenderer.invoke('db:models:delete', id),

  // ==================== 场地库 CRUD ====================
  getLocations: () => ipcRenderer.invoke('db:locations:getAll'),
  createLocation: (data) => ipcRenderer.invoke('db:locations:create', data),
  updateLocation: (id, data) => ipcRenderer.invoke('db:locations:update', id, data),
  deleteLocation: (id) => ipcRenderer.invoke('db:locations:delete', id),

  // ==================== 策划案 CRUD ====================
  getPlans: () => ipcRenderer.invoke('db:plans:getAll'),
  createPlan: (title) => ipcRenderer.invoke('db:plans:create', title),
  createPlanFromTemplate: (title, templateId) => ipcRenderer.invoke('db:plans:createFromTemplate', title, templateId),
  getPlanById: (id) => ipcRenderer.invoke('db:plans:getById', id),
  savePlan: (id, data) => ipcRenderer.invoke('db:plans:save', id, data),
  deletePlan: (id) => ipcRenderer.invoke('db:plans:delete', id),

  // ==================== 模板 ====================
  getTemplates: () => ipcRenderer.invoke('db:templates:getAll'),
  saveTemplate: (name, structure) => ipcRenderer.invoke('db:templates:save', name, structure),
  deleteTemplate: (id) => ipcRenderer.invoke('db:templates:delete', id),

  // ==================== 图片处理 ====================
  compressImage: (sourcePath, category) => ipcRenderer.invoke('image:compress', sourcePath, category),
  saveImageFromBuffer: (buffer, category) => ipcRenderer.invoke('image:saveFromBuffer', buffer, category),
  deleteImageFile: (path) => ipcRenderer.invoke('image:deleteFile', path),
  renameImageFolder: (oldCat, newCat) => ipcRenderer.invoke('image:renameFolder', oldCat, newCat),
  selectImageFiles: (multiple) => ipcRenderer.invoke('image:selectFiles', multiple),
  cleanupTempFolder: (category) => ipcRenderer.invoke('image:cleanupTempFolder', category),
  // 将本地绝对路径转为 local-image:// 协议 URL（纯本地计算，无需 IPC）
  imageToURL: (absolutePath) => {
    if (!absolutePath) return ''
    const normalized = absolutePath.replace(/\\/g, '/')
    return `local-image://host/${normalized}`
  },
  getFilePath: (file) => webUtils.getPathForFile(file),

  // ==================== 导出功能 ====================
  exportImage: (dataUrl, fileName) => ipcRenderer.invoke('system:exportImage', dataUrl, fileName),

  // ==================== 工作区管理 ====================
  workspace: {
    getPath: () => ipcRenderer.invoke('workspace:getPath'),
    selectAndSet: () => ipcRenderer.invoke('workspace:selectAndSet')
  },

  // ==================== 窗口控制 ====================
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    toggleMaximize: () => ipcRenderer.send('window-toggle-maximize'),
    close: () => ipcRenderer.send('window-close')
  }
})
