import path from 'path'

export const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'])
export const IMAGE_MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp'
}

const MAX_IMPORT_FILE_BYTES = 200 * 1024 * 1024
const MAX_IMPORT_IMAGE_COUNT = 2000
const MAX_IMPORT_IMAGE_BYTES = 25 * 1024 * 1024
const MAX_IMPORT_TOTAL_IMAGE_BYTES = 150 * 1024 * 1024

export function localImageUrlToPath(value) {
  if (typeof value !== 'string') return ''
  if (!value.startsWith('local-image://host/')) return value

  let filePath = decodeURIComponent(value.replace('local-image://host/', ''))
  if (process.platform === 'win32' && filePath.startsWith('/')) {
    filePath = filePath.substring(1)
  }
  return filePath
}

export function getImagePath(value) {
  if (!value) return ''
  if (typeof value === 'string') return localImageUrlToPath(value)
  if (typeof value === 'object') {
    return localImageUrlToPath(value.path || value.url || '')
  }
  return ''
}

function normalizeForCompare(targetPath) {
  const resolved = path.resolve(targetPath)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

export function isPathInside(parentPath, targetPath) {
  if (!parentPath || !targetPath) return false
  const parent = normalizeForCompare(parentPath)
  const target = normalizeForCompare(targetPath)
  const relative = path.relative(parent, target)
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}

export function isSupportedImagePath(filePath) {
  return SUPPORTED_IMAGE_EXTENSIONS.has(path.extname(filePath || '').toLowerCase())
}

export function isAllowedImagePath(filePath, workspacePath) {
  if (!filePath || !workspacePath || !isSupportedImagePath(filePath)) return false
  return isPathInside(path.join(workspacePath, 'images'), filePath)
}

export function getImageMimeType(filePath) {
  return IMAGE_MIME_TYPES[path.extname(filePath || '').toLowerCase()] || 'image/jpeg'
}

export function resolveLocalImageRequestPath(requestUrl) {
  const url = new URL(requestUrl)
  let filePath = decodeURIComponent(url.pathname)
  if (process.platform === 'win32' && filePath.startsWith('/')) {
    filePath = filePath.substring(1)
  }
  return filePath
}

function estimateBase64Bytes(base64Str) {
  if (typeof base64Str !== 'string') return 0
  const clean = base64Str.trim()
  if (!clean) return 0
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0
  return Math.floor((clean.length * 3) / 4) - padding
}

export function validateImportPackage(exportData, fileSizeBytes = 0) {
  if (fileSizeBytes > MAX_IMPORT_FILE_BYTES) {
    throw new Error('数据包过大，请拆分后再导入')
  }
  if (!exportData || exportData.type !== 'portraitplanner-export') {
    throw new Error('无效的导出文件格式')
  }
  if (exportData.data && typeof exportData.data !== 'object') {
    throw new Error('导入数据结构无效')
  }
  if (exportData.images && typeof exportData.images !== 'object') {
    throw new Error('导入图片结构无效')
  }

  const images = exportData.images || {}
  const imageEntries = Object.entries(images)
  if (imageEntries.length > MAX_IMPORT_IMAGE_COUNT) {
    throw new Error('数据包图片数量过多，请拆分后再导入')
  }

  let totalBytes = 0
  for (const [oldPath, base64Str] of imageEntries) {
    if (!isSupportedImagePath(oldPath)) {
      throw new Error('数据包包含不支持的图片格式')
    }
    const estimatedBytes = estimateBase64Bytes(base64Str)
    if (estimatedBytes > MAX_IMPORT_IMAGE_BYTES) {
      throw new Error('单张图片过大，请压缩后再导入')
    }
    totalBytes += estimatedBytes
    if (totalBytes > MAX_IMPORT_TOTAL_IMAGE_BYTES) {
      throw new Error('数据包图片总体积过大，请拆分后再导入')
    }
  }
}
