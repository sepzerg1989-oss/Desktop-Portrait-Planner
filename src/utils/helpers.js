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
