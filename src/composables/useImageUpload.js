import { ref } from 'vue'

export function useImageUpload() {
  const isUploading = ref(false)
  const uploadProgress = ref({ current: 0, total: 0 })

  /**
   * 处理多个图片路径，上传并返回结果数组
   * @param {Array<string>} paths 物理路径数组
   * @param {string} category 目录名，如 'models/xx'
   */
  const processImagePaths = async (paths, category) => {
    if (!paths || paths.length === 0) return []
    isUploading.value = true
    uploadProgress.value = { current: 0, total: paths.length }
    
    try {
      const promises = paths.map(async (path) => {
        if (!path) return null
        const result = await window.electronAPI.compressImage(path, category)
        if (result.success) {
          const url = await window.electronAPI.imageToURL(result.path)
          uploadProgress.value.current++
          return { url, path: result.path, ratio: result.ratio || 1 }
        }
        uploadProgress.value.current++
        return null
      })
      
      const results = await Promise.all(promises)
      return results.filter(Boolean)
    } catch (err) {
      console.error('处理图片失败:', err)
      return []
    } finally {
      isUploading.value = false
    }
  }

  /**
   * 处理拖拽事件
   */
  const handleDrop = async (e, category) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return []

    const paths = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => window.electronAPI.getFilePath(f) || f.path)
      .filter(Boolean)

    return await processImagePaths(paths, category)
  }

  /**
   * 处理粘贴事件
   */
  const handlePaste = async (e, category) => {
    const items = e.clipboardData?.items
    if (!items) return []

    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'))
    if (imageItems.length === 0) return []

    isUploading.value = true
    uploadProgress.value = { current: 0, total: imageItems.length }
    
    try {
      const results = await Promise.all(imageItems.map(async (item) => {
        const file = item.getAsFile()
        if (!file) return null

        const path = window.electronAPI.getFilePath(file) || file.path
        if (path) {
          const result = await window.electronAPI.compressImage(path, category)
          uploadProgress.value.current++
          if (result.success) {
            const url = await window.electronAPI.imageToURL(result.path)
            return { url, path: result.path, ratio: result.ratio || 1 }
          }
        } else {
          // 无物理路径（如截图），走 Buffer 流程
          const buffer = await file.arrayBuffer()
          const result = await window.electronAPI.saveImageFromBuffer(buffer, category)
          uploadProgress.value.current++
          if (result.success) {
            const url = await window.electronAPI.imageToURL(result.path)
            return { url, path: result.path, ratio: result.ratio || 1 }
          }
        }
        return null
      }))
      
      return results.filter(Boolean)
    } catch (err) {
      console.error('粘贴图片失败:', err)
      return []
    } finally {
      isUploading.value = false
    }
  }

  /**
   * 选择图片
   */
  const selectPhotos = async (category, multi = false) => {
    const paths = await window.electronAPI.selectImageFiles(multi)
    if (paths && paths.length > 0) {
      return await processImagePaths(paths, category)
    }
    return []
  }

  /**
   * 删除图片
   */
  const deleteImage = async (path) => {
    if (path && path.includes(':')) { // 简单判断是绝对路径
      await window.electronAPI.deleteImageFile(path)
    }
  }

  return {
    isUploading,
    uploadProgress,
    processImagePaths,
    handleDrop,
    handlePaste,
    selectPhotos,
    deleteImage
  }
}
