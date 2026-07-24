import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import Store from 'electron-store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_SETTINGS = {
  closeBehavior: 'tray',
  showCloseToTrayNotice: true,
  autoLaunch: false
}

export class AppBehaviorService {
  constructor(options = {}) {
    this.store = options.store || null
    this.platform = options.platform || process.platform
    this.app = options.app || null
    this.Tray = options.Tray || null
    this.Menu = options.Menu || null
    this.nativeImage = options.nativeImage || null
    this.mainWindow = null
    this.tray = null
    this.isQuitting = false
  }

  static createForTest(options = {}) {
    return new AppBehaviorService(options)
  }

  init({ app, mainWindow, Tray, Menu, nativeImage }) {
    this.app = app
    this.Tray = Tray
    this.Menu = Menu
    this.nativeImage = nativeImage
    this.bindWindow(mainWindow)
    this.createTray()
    this.applyLoginItemSettings()
  }

  bindWindow(mainWindow) {
    if (!mainWindow) return
    this.mainWindow = mainWindow
    mainWindow.on('close', (event) => {
      this.handleWindowClose(event)
    })
  }

  getSettings() {
    return this.normalizeSettings(this.getStore().get('appBehavior', DEFAULT_SETTINGS))
  }

  saveSettings(nextSettings = {}) {
    const saved = this.normalizeSettings({
      ...this.getSettings(),
      ...nextSettings
    })
    this.getStore().set('appBehavior', saved)
    this.applyLoginItemSettings(saved)

    if (saved.closeBehavior === 'tray') {
      this.createTray()
    }

    return saved
  }

  normalizeSettings(value = {}) {
    return {
      closeBehavior: value.closeBehavior === 'quit' ? 'quit' : DEFAULT_SETTINGS.closeBehavior,
      showCloseToTrayNotice: typeof value.showCloseToTrayNotice === 'boolean'
        ? value.showCloseToTrayNotice
        : DEFAULT_SETTINGS.showCloseToTrayNotice,
      autoLaunch: typeof value.autoLaunch === 'boolean' ? value.autoLaunch : DEFAULT_SETTINGS.autoLaunch
    }
  }

  getStore() {
    if (!this.store) {
      this.store = new Store({ name: 'app-behavior-config' })
    }
    return this.store
  }

  getCapabilities() {
    const isMac = this.platform === 'darwin'
    return {
      platform: this.platform,
      isMac,
      isWindows: this.platform === 'win32',
      supportsTray: true,
      supportsAutoLaunch: true,
      backgroundTargetLabel: isMac ? '菜单栏' : '系统托盘',
      closeToBackgroundLabel: isMac ? '关闭窗口后继续在后台运行' : '关闭窗口后收进系统托盘',
      backgroundDescription: isMac
        ? '关闭窗口后，Portrait Planner 会继续在后台运行，可从菜单栏或 Dock 返回。'
        : '关闭窗口后，Portrait Planner 会继续在系统托盘运行，可从托盘图标重新打开。'
    }
  }

  shouldHideOnClose(settings = this.getSettings()) {
    return !this.isQuitting && settings.closeBehavior === 'tray'
  }

  handleWindowClose(event) {
    if (!this.shouldHideOnClose()) return 'quit'

    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault()
    }

    return this.handleCloseToBackground()
  }

  handleCloseToBackground() {
    const settings = this.getSettings()
    if (settings.showCloseToTrayNotice && this.sendCloseNotice()) {
      return 'notice'
    }

    this.hideWindow()
    return 'hide'
  }

  sendCloseNotice() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return false
    const webContents = this.mainWindow.webContents
    if (!webContents || (typeof webContents.isDestroyed === 'function' && webContents.isDestroyed())) {
      return false
    }

    webContents.send('app-behavior:show-close-notice', this.getCapabilities())
    return true
  }

  resolveCloseNotice(payload = {}) {
    if (payload.dontShowAgain === true) {
      this.saveSettings({ showCloseToTrayNotice: false })
    }

    if (payload.action === 'quit') {
      this.requestQuit()
      return { success: true, action: 'quit' }
    }

    this.hideWindow()
    return { success: true, action: 'hide' }
  }

  hideWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.hide()
    }
  }

  showWindow(route = null) {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore()
    }
    this.mainWindow.show()
    this.mainWindow.focus()

    if (route) {
      this.mainWindow.webContents.executeJavaScript(
        `window.location.hash = ${JSON.stringify(route)};`,
        true
      ).catch((err) => console.error('[AppBehaviorService] 跳转设置页失败:', err))
    }
  }

  createTray() {
    if (this.tray || !this.Tray || !this.Menu || !this.nativeImage) return this.tray

    const iconPath = this.resolveTrayIconPath()
    let image = this.nativeImage.createFromPath(iconPath)
    if (this.platform === 'darwin' && image && !image.isEmpty()) {
      image = image.resize({ width: 18, height: 18 })
      image.setTemplateImage(true)
    }

    this.tray = new this.Tray(image)
    this.tray.setToolTip('Portrait Planner')
    this.tray.setContextMenu(this.buildTrayMenu())
    this.tray.on('double-click', () => this.showWindow())
    this.tray.on('click', () => {
      if (this.platform !== 'darwin') {
        this.showWindow()
      }
    })

    return this.tray
  }

  buildTrayMenu() {
    return this.Menu.buildFromTemplate([
      {
        label: '打开 Portrait Planner',
        click: () => this.showWindow()
      },
      {
        label: '设置',
        click: () => this.showWindow('#/settings?tab=behavior')
      },
      { type: 'separator' },
      {
        label: '退出应用',
        click: () => this.requestQuit()
      }
    ])
  }

  resolveTrayIconPath() {
    const appRoot = path.resolve(__dirname, '..', '..')
    const fileName = this.platform === 'darwin' ? 'logo.png' : 'icon.ico'
    const appPath = this.app && typeof this.app.getAppPath === 'function' ? this.app.getAppPath() : appRoot
    const candidates = [
      path.join(appRoot, 'build', fileName),
      path.join(appPath, 'build', fileName),
      path.join(appPath, fileName),
      path.join(appPath, 'dist', fileName),
      path.join(appRoot, 'public', fileName)
    ]

    return candidates.find(candidate => fs.existsSync(candidate)) || candidates[0]
  }

  applyLoginItemSettings(settings = this.getSettings()) {
    if (!this.app || typeof this.app.setLoginItemSettings !== 'function') return

    this.app.setLoginItemSettings({
      openAtLogin: settings.autoLaunch,
      openAsHidden: false
    })
  }

  markQuitting() {
    this.isQuitting = true
  }

  requestQuit() {
    this.markQuitting()
    if (this.app) {
      this.app.quit()
    }
  }

  shouldQuitWhenAllWindowsClosed() {
    return this.isQuitting || this.getSettings().closeBehavior === 'quit'
  }

  registerIpc(ipcMain) {
    ipcMain.handle('app-behavior:getSettings', () => this.getSettings())
    ipcMain.handle('app-behavior:saveSettings', (event, settings) => this.saveSettings(settings))
    ipcMain.handle('app-behavior:getCapabilities', () => this.getCapabilities())
    ipcMain.handle('app-behavior:resolveCloseNotice', (event, payload) => this.resolveCloseNotice(payload))
    ipcMain.handle('app-behavior:quit', () => {
      this.requestQuit()
      return { success: true }
    })
  }
}

export default new AppBehaviorService()
