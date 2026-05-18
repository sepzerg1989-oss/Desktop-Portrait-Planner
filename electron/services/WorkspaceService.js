import { app, dialog } from 'electron'
import Store from 'electron-store'
import path from 'path'
import fs from 'fs'
import DatabaseService from './DatabaseService.js'
import ImageService from './ImageService.js'

/**
 * 工作区服务 — 管理用户本地工作区的初始化与持久化
 * 使用 electron-store 记住上一次选择的工作区路径
 */
class WorkspaceService {
  constructor() {
    this.store = new Store({ name: 'workspace-config' })
    this.currentPath = null
  }

  /**
   * 获取已保存的工作区路径，若无则返回 null
   */
  getSavedPath() {
    return this.store.get('workspacePath', null)
  }

  /**
   * 弹出系统文件夹选择对话框，让用户选择工作区目录
   * @returns {Promise<string|null>} 用户选择的路径，取消则返回 null
   */
  async selectWorkspace(parentWindow = null) {
    const result = await dialog.showOpenDialog(parentWindow, {
      title: '选择工作区文件夹 (Portrait Planner)',
      properties: ['openDirectory', 'createDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const selectedPath = result.filePaths[0]
    await this.initWorkspace(selectedPath)
    return selectedPath
  }

  /**
   * 初始化工作区 — 创建目录结构并初始化数据库
   * @param {string} dirPath - 工作区根目录路径
   */
  async initWorkspace(dirPath) {
    // 创建子目录结构
    const dirs = [
      path.join(dirPath, 'images', 'models'),
      path.join(dirPath, 'images', 'locations'),
      path.join(dirPath, 'images', 'plans'),
      path.join(dirPath, 'exports')
    ]

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }

    // 初始化数据库
    DatabaseService.init(dirPath)

    // 初始化图片服务
    ImageService.setWorkspace(dirPath)

    // 持久化路径
    this.currentPath = dirPath
    this.store.set('workspacePath', dirPath)
  }

  /**
   * 尝试自动恢复上次的工作区（应用启动时调用）
   * @returns {boolean} 是否成功恢复
   */
  async tryRestore() {
    const saved = this.getSavedPath()
    if (saved && fs.existsSync(saved)) {
      await this.initWorkspace(saved)
      return true
    }
    return false
  }

  /**
   * 获取当前工作区路径
   */
  getPath() {
    return this.currentPath
  }

  /**
   * 使用默认路径初始化（首次启动且用户未选择时的兜底方案）
   */
  async initDefault() {
    const defaultPath = path.join(app.getPath('documents'), 'PortraitPlanner')
    await this.initWorkspace(defaultPath)
    return defaultPath
  }
}

export default new WorkspaceService()
