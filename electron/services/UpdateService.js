import { app, BrowserWindow, shell, net } from 'electron'
import fs from 'fs'
import path from 'path'
import Store from 'electron-store'

// ==================== 配置项 ====================
const GITHUB_OWNER = 'sepzerg1989-oss'
const GITHUB_REPO = 'Desktop-Portrait-Planner'

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
   * 获取检测更新配置文件 update.json 的官方路径
   */
  getUpdateConfigUrl() {
    return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/update.json`
  }

  /**
   * 获取检测更新配置文件 update.json 的国内加速镜像路径
   */
  getUpdateConfigMirrorUrl() {
    return `https://gh-proxy.com/https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/update.json`
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
   * 多通道按优先级依次获取，防范国内部分镜像域名失效或污染
   */
  async fetchLatestVersion() {
    const urlsToTry = [
      `https://gh-proxy.com/https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/update.json`,
      `https://ghproxy.net/https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/update.json`,
      this.getUpdateConfigUrl() // 官方直连通道作为最终兜底
    ]

    for (const url of urlsToTry) {
      try {
        console.log(`[UpdateService] 正在尝试获取更新配置: ${url}`)
        const response = await net.fetch(url, { method: 'GET', redirect: 'follow' })
        if (response.ok) {
          const body = await response.text()
          return JSON.parse(body)
        }
        console.warn(`[UpdateService] 加载地址返回状态码异常: ${url} -> ${response.status}`)
      } catch (err) {
        console.warn(`[UpdateService] 加载地址失败: ${url}，错误信息: ${err.message}`)
      }
    }

    throw new Error('所有更新配置通道均获取失败')
  }

  /**
   * 执行流式网络下载（支持国内镜像加速与自动降级重试）
   * 优先使用国内代理加速下载，若失败则自动回退至 GitHub 原地址直连下载
   */
  async downloadPackage(downloadUrl, win) {
    if (this.isDownloading) throw new Error('已有下载任务进行中')
    this.isDownloading = true
    this.cancelRequested = false

    const urlsToTry = [downloadUrl]
    // 若为 GitHub 官方 Release 链接，则优先在其前面加入国内镜像代理
    if (downloadUrl.includes('github.com')) {
      // 增加多个公认国内 GitHub 下载代理，按顺序重试，做多通道降级容灾
      const proxies = [
        'https://gh-proxy.com/',
        'https://ghproxy.net/',
        'https://ghproxy.homeboyc.cn/'
      ]
      proxies.reverse().forEach(proxy => {
        urlsToTry.unshift(`${proxy}${downloadUrl}`)
      })
    }

    const ext = process.platform === 'darwin' ? '.dmg' : '.exe'
    const fileName = `PortraitPlanner_Update_${Date.now()}${ext}`
    const tempPath = path.join(app.getPath('temp'), fileName)
    this.tempFilePath = tempPath

    let lastError = null

    for (const url of urlsToTry) {
      console.log(`[UpdateService] 正在尝试下载安装包: ${url}`)
      const fileStream = fs.createWriteStream(tempPath)

      try {
        const response = await net.fetch(url, { method: 'GET', redirect: 'follow' })
        if (!response.ok) {
          throw new Error(`状态码异常: ${response.status}`)
        }

        const totalBytes = parseInt(response.headers.get('content-length'), 10) || 0
        let downloadedBytes = 0

        const reader = response.body.getReader()
        while (true) {
          if (this.cancelRequested) {
            throw new Error('USER_CANCELLED')
          }
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
        console.log(`[UpdateService] 成功从地址下载完成: ${url}`)
        return tempPath
      } catch (err) {
        console.warn(`[UpdateService] 从地址下载失败: ${url}，错误信息: ${err.message}`)
        lastError = err
        fileStream.close()
        if (fs.existsSync(tempPath)) {
          try { fs.unlinkSync(tempPath) } catch (_) {}
        }
        if (err.message === 'USER_CANCELLED') {
          break
        }
      }
    }

    this.isDownloading = false
    throw lastError || new Error('所有下载通道均失败')
  }

  /**
   * 用户请求取消当前的下载
   */
  cancelDownload() {
    if (this.isDownloading) {
      this.cancelRequested = true
      console.log('[UpdateService] 用户请求取消更新下载。')
    }
  }

  /**
   * 触发下载并自动执行升级安装
   */
  async startDownloadAndInstall(downloadUrl, win) {
    try {
      const packagePath = await this.downloadPackage(downloadUrl, win)
      console.log('[UpdateService] 安装包下载完成:', packagePath)

      if (process.platform === 'win32' || process.platform === 'darwin') {
        // Windows/macOS: 使用 shell.openPath 启动安装程序（Windows 下支持触发 UAC 提权），随后退出应用
        const errorMsg = await shell.openPath(packagePath)
        if (errorMsg) {
          throw new Error(`无法启动安装包: ${errorMsg}`)
        }
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
