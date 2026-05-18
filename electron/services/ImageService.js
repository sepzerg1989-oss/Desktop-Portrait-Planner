import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

/**
 * 图片处理服务 — 基于 sharp 的图片压缩与存储
 * 核心职责：接收源图片，压缩至 ≤300kb，存入工作区对应子目录
 */
class ImageService {
  constructor() {
    this.workspacePath = null
    this.MAX_SIZE_BYTES = 300 * 1024 // 300kb 性能底线
    this.queue = []
    this.runningCount = 0
    this.MAX_CONCURRENCY = 5 // 同时进行的压缩任务数
  }

  /** 设置工作区路径 */
  setWorkspace(workspacePath) {
    this.workspacePath = workspacePath
  }

  /**
   * 压缩并存储图片（带并发队列控制）
   */
  async compressAndStore(sourcePath, category = 'plans') {
    return new Promise((resolve, reject) => {
      this.queue.push({ sourcePath, category, resolve, reject })
      this.next()
    })
  }

  async next() {
    if (this.runningCount >= this.MAX_CONCURRENCY || this.queue.length === 0) {
      return
    }

    this.runningCount++
    const { sourcePath, category, resolve, reject } = this.queue.shift()

    try {
      const result = await this._doCompress(sourcePath, category)
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.runningCount--
      this.next()
    }
  }

  /**
   * 实际执行压缩的私有方法
   */
  async _doCompress(sourcePath, category = 'plans') {
    if (!this.workspacePath) {
      throw new Error('工作区尚未初始化')
    }

    // 确保目标目录存在 (支持嵌套目录，如 'plans/123')
    const categoryParts = category.split(/[\\\/]/)
    const targetDir = path.join(this.workspacePath, 'images', ...categoryParts)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    // 生成唯一文件名（保留原始扩展名）
    const ext = path.extname(sourcePath).toLowerCase() || '.jpg'
    const hash = crypto.randomBytes(8).toString('hex')
    const timestamp = Date.now()
    const fileName = `${timestamp}_${hash}${ext}`
    const targetPath = path.join(targetDir, fileName)

    try {
      // 1. 预处理：获取元数据并处理旋转
      // 关键：.rotate() 会根据 EXIF 标签自动旋转图片，确保宽高比与视觉一致
      const image = sharp(sourcePath).rotate()
      const metadata = await image.metadata()
      
      // 性能优化：如果图片非常大，立即强制缩小分辨率到 1600px 宽度
      let pipeline = image
      let currentWidth = metadata.width
      let currentHeight = metadata.height

      if (metadata.width > 1600) {
        pipeline = pipeline.resize({ width: 1600, withoutEnlargement: true })
        // 更新当前的比例计算基准
        currentHeight = Math.round(metadata.height * (1600 / metadata.width))
        currentWidth = 1600
      }

      // 2. 尝试快速压缩 (Quality 80)
      let buffer = await pipeline
        .jpeg({ quality: 80, mozjpeg: true, progressive: true })
        .toBuffer()

      // 3. 如果依然超过 300kb，采取更激进的压缩
      if (buffer.length > this.MAX_SIZE_BYTES) {
        const sizeRatio = Math.sqrt(this.MAX_SIZE_BYTES / buffer.length)
        currentWidth = Math.min(1200, Math.round(currentWidth * sizeRatio * 0.9))
        
        buffer = await sharp(sourcePath)
          .rotate()
          .resize({ width: currentWidth, withoutEnlargement: true })
          .jpeg({ quality: 60, mozjpeg: true, progressive: true })
          .toBuffer()
      }

      // 4. 兜底方案
      if (buffer.length > this.MAX_SIZE_BYTES) {
        buffer = await sharp(sourcePath)
          .rotate()
          .resize({ width: 800, withoutEnlargement: true })
          .jpeg({ quality: 40, mozjpeg: true })
          .toBuffer()
      }

      // 5. 获取最终准确的比例
      const finalMetadata = await sharp(buffer).metadata()
      const ratio = finalMetadata.width / finalMetadata.height

      fs.writeFileSync(targetPath, buffer)
      return { success: true, path: targetPath, ratio: ratio }
    } catch (error) {
      console.error('[ImageService] 图片压缩失败:', error)
      return { success: false, error: error.message }
    }
  }
  /**
   * 删除指定的实体文件夹（用于清理已删除的数据项）
   */
  _isPathWithinWorkspace(targetPath) {
    if (!this.workspacePath) return false
    const normalizedTarget = path.normalize(targetPath)
    const normalizedBase = path.normalize(path.join(this.workspacePath, 'images'))
    return normalizedTarget.startsWith(normalizedBase + path.sep) || normalizedTarget === normalizedBase
  }

  _sanitizeCategory(category) {
    if (!category) return null
    const parts = category.split(/[\\\/]/).filter(p => p && p !== '..' && !p.includes(':'))
    if (parts.length === 0) return null
    return parts
  }

  async deleteEntityFolder(category) {
    if (!this.workspacePath || !category) return
    const categoryParts = this._sanitizeCategory(category)
    if (!categoryParts) return
    const targetDir = path.join(this.workspacePath, 'images', ...categoryParts)

    if (!this._isPathWithinWorkspace(targetDir)) {
      console.warn(`[ImageService] 拒绝删除非工作区目录: ${targetDir}`)
      return
    }

    try {
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true })
        console.log(`[ImageService] 已清理资源目录: ${targetDir}`)
      }
    } catch (error) {
      console.error(`[ImageService] 清理资源目录失败: ${targetDir}`, error)
    }
  }

  /**
   * 删除单个图片文件
   */
  async deleteFile(absolutePath) {
    if (!this.workspacePath || !absolutePath) return { success: false }
    
    try {
      const normalizedPath = path.normalize(absolutePath)

      if (!this._isPathWithinWorkspace(normalizedPath) && normalizedPath !== path.normalize(path.join(this.workspacePath, 'images'))) {
        console.warn(`[ImageService] 拒绝删除非工作区图片: ${absolutePath}`)
        return { success: false, error: 'Access denied' }
      }

      if (fs.existsSync(normalizedPath)) {
        fs.unlinkSync(normalizedPath)
        return { success: true }
      }
      return { success: false, error: 'File not found' }
    } catch (error) {
      console.error(`[ImageService] 删除文件失败: ${absolutePath}`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 重命名实体文件夹
   */
  async renameEntityFolder(oldCategory, newCategory) {
    if (!this.workspacePath || !oldCategory || !newCategory) return { success: false }
    if (oldCategory === newCategory) return { success: true }

    const oldParts = this._sanitizeCategory(oldCategory)
    const newParts = this._sanitizeCategory(newCategory)
    if (!oldParts || !newParts) return { success: false, error: 'Invalid category' }

    const oldPath = path.join(this.workspacePath, 'images', ...oldParts)
    const newPath = path.join(this.workspacePath, 'images', ...newParts)

    if (!this._isPathWithinWorkspace(oldPath) || !this._isPathWithinWorkspace(newPath)) {
      console.warn(`[ImageService] 拒绝重命名非工作区目录: ${oldPath} -> ${newPath}`)
      return { success: false, error: 'Access denied' }
    }

    try {
      if (fs.existsSync(oldPath)) {
        const newParent = path.dirname(newPath)
        if (!fs.existsSync(newParent)) {
          fs.mkdirSync(newParent, { recursive: true })
        }
        
        fs.renameSync(oldPath, newPath)
        console.log(`[ImageService] 文件夹已重命名: ${oldPath} -> ${newPath}`)
        return { success: true }
      }
      return { success: false, error: 'Source folder not found' }
    } catch (error) {
      console.error(`[ImageService] 重命名文件夹失败: ${oldPath}`, error)
      return { success: false, error: error.message }
    }
  }
}

export default new ImageService()
