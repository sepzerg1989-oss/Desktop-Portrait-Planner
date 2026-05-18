import { app, BrowserWindow, ipcMain, protocol, dialog, Menu } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

// 主进程服务
import WorkspaceService from './services/WorkspaceService.js'
import DatabaseService from './services/DatabaseService.js'
import ImageService from './services/ImageService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    frame: false, // 彻底移除系统默认边框
    titleBarStyle: 'hidden', // macOS 下隐藏标题栏，但保留控制按钮
    backgroundColor: '#E2DED0', // 匹配我们的莫兰迪背景色
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // 开发环境下加载 Vite 的开发服务器地址
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools() // 开发时自动打开调试工具
  } else {
    // 生产环境下加载打包后的文件
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// ==================== 注册本地图片自定义协议 ====================
// 使用 local-image:// 协议安全地加载工作区中的本地图片
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-image',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      standard: true,
      bypassCSP: true,
    },
  },
])

app.whenReady().then(async () => {
  // 注册自定义协议处理器 — 将 local-image://path 映射到本地文件
  protocol.handle('local-image', async (request) => {
    const url = new URL(request.url)
    let filePath = decodeURIComponent(url.pathname)

    if (process.platform === 'win32' && filePath.startsWith('/')) {
      filePath = filePath.substring(1)
    }

    try {
      await fs.promises.access(filePath, fs.constants.R_OK)
    } catch (e) {
      return new Response('File not found', { status: 404 })
    }

    // 使用流式返回，避免阻塞主进程
    const stream = fs.createReadStream(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const mimeMap = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.webp': 'image/webp',
      '.gif': 'image/gif', '.bmp': 'image/bmp',
    }
    return new Response(stream, {
      headers: { 'Content-Type': mimeMap[ext] || 'image/jpeg' },
    })
  })

  // 尝试恢复上次的工作区
  let restored = await WorkspaceService.tryRestore()
  
  if (!restored) {
    // 第一次启动：弹出对话框强制选择工作区
    const selectedPath = await WorkspaceService.selectWorkspace()
    if (!selectedPath) {
      // 如果用户取消了首次启动的选择，则退出程序
      app.quit()
      return
    }
  }

  createWindow()

  // 隐藏默认菜单
  Menu.setApplicationMenu(null)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  DatabaseService.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ==================== IPC 处理器注册 ====================

// --- 工作区相关 ---
ipcMain.handle('workspace:getPath', () => {
  return WorkspaceService.getPath()
})

ipcMain.handle('workspace:selectAndSet', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const newPath = await WorkspaceService.selectWorkspace(win)
  if (newPath) {
    return { success: true, path: newPath }
  }
  return { success: false }
})

// --- 模特库 CRUD ---
ipcMain.handle('db:models:getAll', () => {
  return DatabaseService.getAll('models')
})

ipcMain.handle('db:models:create', (event, data) => {
  return DatabaseService.insert('models', data)
})

ipcMain.handle('db:models:update', (event, id, data) => {
  return DatabaseService.update('models', id, data)
})

ipcMain.handle('db:models:delete', async (event, id) => {
  const result = DatabaseService.delete('models', id)
  if (result.success) {
    await ImageService.deleteEntityFolder(`models/${id}`)
  }
  return result
})

// --- 场地库 CRUD ---
ipcMain.handle('db:locations:getAll', () => {
  return DatabaseService.getAll('locations')
})

ipcMain.handle('db:locations:create', (event, data) => {
  return DatabaseService.insert('locations', data)
})

ipcMain.handle('db:locations:update', (event, id, data) => {
  return DatabaseService.update('locations', id, data)
})

ipcMain.handle('db:locations:delete', async (event, id) => {
  const result = DatabaseService.delete('locations', id)
  if (result.success) {
    await ImageService.deleteEntityFolder(`locations/${id}`)
  }
  return result
})

// --- 策划案 CRUD ---
ipcMain.handle('db:plans:getAll', () => {
  return DatabaseService.getAll('plans')
})

ipcMain.handle('db:plans:create', (event, title) => {
  return DatabaseService.createEmptyPlan(title)
})

ipcMain.handle('db:plans:createFromTemplate', (event, title, templateId) => {
  const template = DatabaseService.getById('templates', templateId)
  if (!template) return null
  const structure = JSON.parse(template.structure_json)
  // 根据模板结构生成模块 JSON
  const modules = structure.map((item, idx) => ({
    id: 'm' + Date.now() + idx,
    type: item.type,
    title: item.title,
    data: getDefaultDataForType(item.type)
  }))
  return DatabaseService.insert('plans', {
    title,
    modules_json: JSON.stringify(modules)
  })
})

ipcMain.handle('db:plans:getById', (event, id) => {
  return DatabaseService.getById('plans', id)
})

ipcMain.handle('db:plans:save', (event, id, data) => {
  return DatabaseService.savePlan(id, data)
})

ipcMain.handle('db:plans:delete', async (event, id) => {
  const result = DatabaseService.delete('plans', id)
  if (result.success) {
    await ImageService.deleteEntityFolder(`plans/${id}`)
  }
  return result
})

// --- 模板 ---
ipcMain.handle('db:templates:getAll', () => {
  return DatabaseService.getTemplates()
})

ipcMain.handle('db:templates:save', (event, name, structure) => {
  return DatabaseService.saveTemplate(name, structure)
})

ipcMain.handle('db:templates:delete', (event, id) => {
  return DatabaseService.delete('templates', id)
})

// --- 图片处理 ---
ipcMain.handle('image:compress', async (event, sourcePath, category) => {
  return await ImageService.compressAndStore(sourcePath, category)
})

// 处理从 Buffer 保存图片（用于剪贴板等）
ipcMain.handle('image:saveFromBuffer', async (event, buffer, category) => {
  const tempPath = path.join(app.getPath('temp'), `temp_${Date.now()}.png`)
  fs.writeFileSync(tempPath, Buffer.from(buffer))
  const result = await ImageService.compressAndStore(tempPath, category)
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
  return result
})

ipcMain.handle('image:deleteFile', async (event, absolutePath) => {
  return await ImageService.deleteFile(absolutePath)
})

ipcMain.handle('image:renameFolder', async (event, oldCategory, newCategory) => {
  return await ImageService.renameEntityFolder(oldCategory, newCategory)
})

// 打开系统文件选择对话框（选择图片）
ipcMain.handle('image:selectFiles', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showOpenDialog(win, {
    title: '选择图片',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] }
    ]
  })
  if (result.canceled) return []
  return result.filePaths
})



// --- 导出功能 ---
ipcMain.handle('image:cleanupTempFolder', async (event, category) => {
  return await ImageService.deleteEntityFolder(category)
})

// --- 导出功能 ---
ipcMain.handle('system:exportImage', async (event, dataUrl, defaultName) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showSaveDialog(win, {
    title: '导出为长图',
    defaultPath: defaultName || '策划案_长图.jpg',
    filters: [
      { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] }
    ]
  })

  if (result.canceled || !result.filePath) {
    return { success: false, error: 'User canceled' }
  }

  try {
    // 提取 base64 数据
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(result.filePath, buffer);
    return { success: true, filePath: result.filePath }
  } catch (err) {
    console.error('Export error:', err);
    return { success: false, error: err.message }
  }
})

// --- 窗口控制 ---
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win.minimize()
})

ipcMain.on('window-toggle-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win.isMaximized()) {
    win.unmaximize()
  } else {
    win.maximize()
  }
})

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win.close()
})

// ==================== 辅助函数 ====================

/** 根据模块类型返回默认数据结构 */
function getDefaultDataForType(type) {
  const map = {
    theme: { title: '', description: '', images: [] },
    model: { name: '', avatar: '', tags: [] },
    location: { name: '', address: '', images: [] },
    reference: { images: [] },
    clothing: { description: '', images: [] },
    props: { description: '', images: [] },
    custom: { description: '', images: [] },
  }
  return map[type] || {}
}
