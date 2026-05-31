/**
 * 通用工具函数
 * 全局复用的纯函数集合
 */

/**
 * 将数组按指定大小分块（用于等分行高排列布局）
 * @param {Array} array - 源数组
 * @param {number} size - 每块大小
 * @returns {Array[]} 分块后的二维数组
 */
export const chunkArray = (array, size) => {
  if (!array) return []
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

/**
 * 清理文件名中的非法字符，用于生成安全的文件夹名称
 * @param {string} name - 原始名称
 * @returns {string} 清理后的安全名称
 */
export const sanitize = (name) => (name || '').replace(/[\\\/:*?"<>|]/g, '_').trim() || 'unnamed'

/**
 * 从价格字符串中提取数值用于排序
 * @param {string|number} priceStr - 价格字符串（如 "¥500元"）
 * @returns {number} 提取出的数值，无数值则返回 0
 */
export const parseNumericPrice = (priceStr) => {
  if (!priceStr) return 0
  const match = String(priceStr).match(/(\d+(\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}