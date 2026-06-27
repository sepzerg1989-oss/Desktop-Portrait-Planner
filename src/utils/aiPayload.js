function cleanText(value) {
  return typeof value === 'string' ? value : ''
}

function cleanNumber(value) {
  return Number.isFinite(value) ? value : undefined
}

function cleanImage(image) {
  if (!image) return null
  if (typeof image === 'string') return image

  const result = {}
  if (typeof image.path === 'string') result.path = image.path
  if (typeof image.url === 'string') result.url = image.url

  const ratio = cleanNumber(image.ratio)
  if (ratio !== undefined) result.ratio = ratio

  return Object.keys(result).length > 0 ? result : null
}

export function createThemeCopyPayload(formData = {}) {
  const rawImages = Array.isArray(formData.images) ? formData.images : []

  return {
    title: cleanText(formData.title),
    description: cleanText(formData.description),
    images: rawImages
      .map(cleanImage)
      .filter(Boolean)
  }
}
