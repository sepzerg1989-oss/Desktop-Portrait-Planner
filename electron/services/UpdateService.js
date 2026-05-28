import { app, BrowserWindow, shell, net } from 'electron'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import Store from 'electron-store'

// ==================== 配置项 ====================
const GITHUB_OWNER = 'sepzerg1989-oss'
const GITHUB_REPO = 'Desktop-Portrait-Planner-Releases'

const store = new Store()

class UpdateService {
  constructor() {
    this.currentVersion = app.getVersion()
    this.tempFilePath = null
    this.isDownloading = false

    // 如果检测到当前版本号变了，重置被忽略的版本，以方便开发调试和测试弹窗
    const lastRunVersion = store.get('lastRunVersion')
    if (lastRunVersion !== this.currentVersion) {
      store.delete('ignoredVersion')
      store.set('lastRunVersion', this.currentVersion)
      console.log(`[UpdateService] 检测到软件版本变更：v${lastRunVersion} -> v${this.currentVersion}，已重置已忽略的版本记录。`)
    }
  }

  /**
   * 获取检测更新配置文件 update.json 的路径
   */
  getUpdateConfigUrl() {
    return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/update.json`
  }

  /**
   * 自动在启动时检测更新（排除已忽略的版本）
   * @param {BrowserWindow} win 
   */
  async autoCheck(win) {
    try {
      const updateInfo = await this.fetchLatestVersion()
      if (!updateInfo) return

      const ignoredVersion = store.get('ignoredVersion')
      if (ignoredVersion === updateInfo.version) {
        console.log(`[UpdateService] 自动更新已静默：版本 v${updateInfo.version} 已被用户忽略`)
        return
      }

      if (this.compareVersion(updateInfo.version, this.currentVersion) > 0) {
        console.log(`[UpdateService] 发现新版本 v${updateInfo.version}`)
        win.webContents.send('update:available', {
          version: updateInfo.version,
          changelog: updateInfo.changelog,
          downloadUrl: process.platform === 'darwin' ? updateInfo.macDownloadUrl : updateInfo.downloadUrl
        })
      }
    } catch (err) {
      console.warn('[UpdateService] 启动自动检查更新失败:', err.message)
    }
  }

  /**
   * 手动点击检测更新（无视忽略标志）
   */
  async manualCheck() {
    try {
      const updateInfo = await this.fetchLatestVersion()
      if (!updateInfo) {
        return { hasUpdate: false, msg: '获取更新配置失败', currentVersion: this.currentVersion }
      }

      const hasUpdate = this.compareVersion(updateInfo.version, this.currentVersion) > 0
      return {
        hasUpdate,
        currentVersion: this.currentVersion,
        latestVersion: updateInfo.version,
        changelog: updateInfo.changelog,
        downloadUrl: process.platform === 'darwin' ? updateInfo.macDownloadUrl : updateInfo.downloadUrl
      }
    } catch (err) {
      console.error('[UpdateService] 手动检查更新失败:', err)
      return { hasUpdate: false, error: err.message, currentVersion: this.currentVersion }
    }
  }

  /**
   * 忽略该版本号
   */
  ignoreVersion(version) {
    store.set('ignoredVersion', version)
    console.log(`[UpdateService] 用户已忽略版本：v${version}`)
    return { success: true }
  }

  /**
   * 从云端获取最新 update.json 的配置内容
   * 使用 Electron 的 net.fetch，能完美穿透国内代理、自动集成系统代理设置
   */
  async fetchLatestVersion() {
    const url = this.getUpdateConfigUrl()
    const response = await net.fetch(url, { method: 'GET', redirect: 'follow' })
    if (!response.ok) {
      throw new Error(`状态码异常: ${response.status}`)
    }
    const body = await response.text()
    try {
      return JSON.parse(body)
    } catch (e) {
      throw new Error('解析更新 JSON 失败')
    }
  }

  /**
   * 执行流式网络下载（支持国内镜像加速）
   * 采用 Electron 的 net.fetch，完美适配系统 VPN/代理，防止 TLS 握手断开错误
   */
  async downloadPackage(downloadUrl, win) {
    if (this.isDownloading) throw new Error('已有下载任务进行中')
    this.isDownloading = true

    const finalUrl = downloadUrl

    const ext = process.platform === 'darwin' ? '.dmg' : '.exe'
    const fileName = `PortraitPlanner_Update_${Date.now()}${ext}`
    const tempPath = path.join(app.getPath('temp'), fileName)
    this.tempFilePath = tempPath

    const fileStream = fs.createWriteStream(tempPath)

    try {
      const response = await net.fetch(finalUrl, { method: 'GET', redirect: 'follow' })
      if (!response.ok) {
        throw new Error(`下载失败，状态码: ${response.status}`)
      }

      const totalBytes = parseInt(response.headers.get('content-length'), 10) || 0
      let downloadedBytes = 0

      const reader = response.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        fileStream.write(Buffer.from(value))
        downloadedBytes += value.length

        if (totalBytes > 0) {
          const percent = Math.round((downloadedBytes / totalBytes) * 100)
          if (win && !win.isDestroyed()) {
            win.webContents.send('update:download-progress', percent)
          }
        }
      }

      fileStream.end()
      this.isDownloading = false
      return tempPath
    } catch (err) {
      this.isDownloading = false
      fileStream.close()
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath) } catch (_) {}
      }
      throw err
    }
  }

  /**
   * 触发下载并自动执行升级安装
   */
  async startDownloadAndInstall(downloadUrl, win) {
    try {
      const packagePath = await this.downloadPackage(downloadUrl, win)
      console.log('[UpdateService] 安装包下载完成:', packagePath)

      if (process.platform === 'win32') {
        // Windows: 执行 exe 静默/交互安装，拉起后退出本应用以防被锁死占用
        const child = spawn(packagePath, {
          detached: true,
          stdio: 'ignore'
        })
        child.unref()
        app.quit()
      } else if (process.platform === 'darwin') {
        // macOS: 使用 shell.openPath 挂载打开 DMG 安装包，随后立即退出应用
        await shell.openPath(packagePath)
        app.quit()
      }
      return { success: true }
    } catch (err) {
      console.error('[UpdateService] 下载升级失败:', err)
      this.isDownloading = false
      return { success: false, error: err.message }
    }
  }

  /**
   * 辅助工具：版本号对比 (v1 > v2 返回正数，v1 < v2 返回负数，相等返回0)
   */
  compareVersion(v1, v2) {
    const parts1 = v1.replace(/^v/, '').split('.').map(Number)
    const parts2 = v2.replace(/^v/, '').split('.').map(Number)
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0
      const num2 = parts2[i] || 0
      if (num1 !== num2) {
        return num1 - num2
      }
    }
    return 0
  }
}

export default new UpdateService()
