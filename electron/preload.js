const { contextBridge, ipcRenderer, webUtils } = require('electron')

// 暴露类型化的安全 API 给渲染进程 (Vue 页面)
contextBridge.exposeInMainWorld('electronAPI', {

  // ==================== 模特库 CRUD ====================
  getModels: () => ipcRenderer.invoke('db:models:getAll'),
  createModel: (data) => ipcRenderer.invoke('db:models:create', data),
  updateModel: (id, data) => ipcRenderer.invoke('db:models:update', id, data),
  deleteModel: (id) => ipcRenderer.invoke('db:models:delete', id),
  deleteModelsBatch: (ids) => ipcRenderer.invoke('db:models:deleteBatch', ids),

  // ==================== 场地库 CRUD ====================
  getLocations: () => ipcRenderer.invoke('db:locations:getAll'),
  createLocation: (data) => ipcRenderer.invoke('db:locations:create', data),
  updateLocation: (id, data) => ipcRenderer.invoke('db:locations:update', id, data),
  deleteLocation: (id) => ipcRenderer.invoke('db:locations:delete', id),
  deleteLocationsBatch: (ids) => ipcRenderer.invoke('db:locations:deleteBatch', ids),

  // ==================== 服装库 CRUD ====================
  getClothings: () => ipcRenderer.invoke('db:clothing:getAll'),
  createClothing: (data) => ipcRenderer.invoke('db:clothing:create', data),
  updateClothing: (id, data) => ipcRenderer.invoke('db:clothing:update', id, data),
  deleteClothing: (id) => ipcRenderer.invoke('db:clothing:delete', id),
  deleteClothingsBatch: (ids) => ipcRenderer.invoke('db:clothing:deleteBatch', ids),

  // ==================== 道具库 CRUD ====================
  getProps: () => ipcRenderer.invoke('db:props:getAll'),
  createProp: (data) => ipcRenderer.invoke('db:props:create', data),
  updateProp: (id, data) => ipcRenderer.invoke('db:props:update', id, data),
  deleteProp: (id) => ipcRenderer.invoke('db:props:delete', id),
  deletePropsBatch: (ids) => ipcRenderer.invoke('db:props:deleteBatch', ids),

  // ==================== 妆容库 CRUD ====================
  getMakeups: () => ipcRenderer.invoke('db:makeup:getAll'),
  createMakeup: (data) => ipcRenderer.invoke('db:makeup:create', data),
  updateMakeup: (id, data) => ipcRenderer.invoke('db:makeup:update', id, data),
  deleteMakeup: (id) => ipcRenderer.invoke('db:makeup:delete', id),
  deleteMakeupsBatch: (ids) => ipcRenderer.invoke('db:makeup:deleteBatch', ids),

  // ==================== 策划案 CRUD ====================
  getPlans: () => ipcRenderer.invoke('db:plans:getAll'),
  createPlan: (title) => ipcRenderer.invoke('db:plans:create', title),
  createPlanFromTemplate: (title, templateId) => ipcRenderer.invoke('db:plans:createFromTemplate', title, templateId),
  getPlanById: (id) => ipcRenderer.invoke('db:plans:getById', id),
  savePlan: (id, data) => ipcRenderer.invoke('db:plans:save', id, data),
  deletePlan: (id) => ipcRenderer.invoke('db:plans:delete', id),
  deletePlansBatch: (ids) => ipcRenderer.invoke('db:plans:deleteBatch', ids),

  // ==================== 模板 ====================
  getTemplates: () => ipcRenderer.invoke('db:templates:getAll'),
  saveTemplate: (name, structure) => ipcRenderer.invoke('db:templates:save', name, structure),
  deleteTemplate: (id) => ipcRenderer.invoke('db:templates:delete', id),

  // ==================== 图片处理 ====================
  compressImage: (sourcePath, category) => ipcRenderer.invoke('image:compress', sourcePath, category),
  saveImageFromBuffer: (buffer, category) => ipcRenderer.invoke('image:saveFromBuffer', buffer, category),
  deleteImageFile: (path) => ipcRenderer.invoke('image:deleteFile', path),
  renameImageFolder: (oldCat, newCat) => ipcRenderer.invoke('image:renameFolder', oldCat, newCat),
  copyFilesToEntity: (sourcePaths, category) => ipcRenderer.invoke('image:copyFilesToEntity', sourcePaths, category),
  selectImageFiles: (multiple) => ipcRenderer.invoke('image:selectFiles', multiple),
  cleanupTempFolder: (category) => ipcRenderer.invoke('image:cleanupTempFolder', category),
  // 将本地绝对路径转为 local-image:// 协议 URL（纯本地计算，无需 IPC）
  imageToURL: (absolutePath) => {
    if (!absolutePath) return ''
    const normalized = absolutePath.replace(/\\/g, '/')
    return `local-image://host/${normalized}`
  },
  getFilePath: (file) => webUtils.getPathForFile(file),

  // ==================== 导出与导入功能 ====================
  exportImage: (dataUrl, fileName) => ipcRenderer.invoke('system:exportImage', dataUrl, fileName),
  exportData: (ids) => ipcRenderer.invoke('system:exportData', ids),
  importData: (filePath) => ipcRenderer.invoke('system:importData', filePath),

  // ==================== 工作区管理 ====================
  workspace: {
    getPath: () => ipcRenderer.invoke('workspace:getPath'),
    selectAndSet: () => ipcRenderer.invoke('workspace:selectAndSet')
  },

  // ==================== 自动与手动更新 ====================
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  ignoreVersion: (ver) => ipcRenderer.invoke('update:ignore', ver),
  startDownload: (url) => ipcRenderer.invoke('update:download', url),
  cancelDownload: () => ipcRenderer.invoke('update:cancel'),
  onDownloadProgress: (callback) => {
    const listener = (e, val) => callback(val)
    ipcRenderer.on('update:download-progress', listener)
    return () => ipcRenderer.removeListener('update:download-progress', listener)
  },
  onUpdateAvailable: (callback) => {
    const listener = (e, data) => callback(data)
    ipcRenderer.on('update:available', listener)
    return () => ipcRenderer.removeListener('update:available', listener)
  },

  // ==================== 窗口控制 ====================
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    toggleMaximize: () => ipcRenderer.send('window-toggle-maximize'),
    close: () => ipcRenderer.send('window-close')
  },

  // ==================== 应用行为设置 ====================
  appBehavior: {
    getSettings: () => ipcRenderer.invoke('app-behavior:getSettings'),
    saveSettings: (settings) => ipcRenderer.invoke('app-behavior:saveSettings', settings),
    getCapabilities: () => ipcRenderer.invoke('app-behavior:getCapabilities'),
    resolveCloseNotice: (payload) => ipcRenderer.invoke('app-behavior:resolveCloseNotice', payload),
    onCloseNotice: (callback) => {
      const listener = (event, payload) => callback(payload)
      ipcRenderer.on('app-behavior:show-close-notice', listener)
      return () => ipcRenderer.removeListener('app-behavior:show-close-notice', listener)
    },
    quit: () => ipcRenderer.invoke('app-behavior:quit')
  },

  // ==================== 高奢多主题同步与持久化 ====================
  theme: {
    getSavedTheme: () => ipcRenderer.invoke('theme:getSaved'),
    saveTheme: (themeName) => ipcRenderer.invoke('theme:save', themeName),
    setBackgroundColor: (hexColor) => ipcRenderer.send('theme:setBackgroundColor', hexColor)
  },

  // ==================== AI 创意生成 ====================
  ai: {
    getConfig: () => ipcRenderer.invoke('ai:getConfig'),
    saveConfig: (config) => ipcRenderer.invoke('ai:saveConfig', config),
    resetPrompt: () => ipcRenderer.invoke('ai:resetPrompt'),
    generateThemeCopy: (payload) => ipcRenderer.invoke('ai:generateThemeCopy', payload),
    testConnection: (config) => ipcRenderer.invoke('ai:testConnection', config)
  },

  // ==================== 系统外部打开 ====================
  openExternal: (url) => ipcRenderer.invoke('system:openExternal', url),

  // ==================== 剪贴板 ====================
  clipboard: {
    copyImage: (pathOrUrl) => ipcRenderer.invoke('clipboard:copyImage', pathOrUrl)
  }
})
