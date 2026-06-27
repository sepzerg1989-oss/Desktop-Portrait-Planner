import fs from 'fs'
import Store from 'electron-store'

import {
  getImageMimeType,
  getImagePath,
  isAllowedImagePath
} from './DataSafety.js'

export const DEFAULT_AI_PROMPT = [
  '你是一位资深人像摄影策划与独立画册编辑。',
  '请根据用户提供的主题标题和参考图片，生成一段中文文案。',
  '文案不需要描述图片的内容,包括人物，只需要体现画面的意境和氛围感觉，可以作为杂志图片下的一段文字',
  '不要超过40个字，只输出正文，不要标题、编号、解释或 Markdown。'
].join('\n')

const CONFIG_KEY = 'aiConfig'
const PROVIDERS = new Set(['gemini', 'glm'])
const MAX_IMAGE_COUNT = 4
const GLM_ENDPOINT = 'https://api.z.ai/api/paas/v4/chat/completions'

function blankConfig() {
  return {
    provider: 'gemini',
    gemini: { model: 'gemini-3.5-flash', apiKey: '' },
    glm: { model: 'GLM-4V-Flash', apiKey: '' },
    prompt: DEFAULT_AI_PROMPT
  }
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeConfig(value = {}) {
  const defaults = blankConfig()
  const provider = PROVIDERS.has(value.provider) ? value.provider : defaults.provider

  return {
    provider,
    gemini: {
      model: cleanText(value.gemini?.model) || defaults.gemini.model,
      apiKey: cleanText(value.gemini?.apiKey)
    },
    glm: {
      model: cleanText(value.glm?.model) || defaults.glm.model,
      apiKey: cleanText(value.glm?.apiKey)
    },
    prompt: cleanText(value.prompt) || defaults.prompt
  }
}

function extractGeneratedText(provider, payload) {
  if (!payload || typeof payload !== 'object') return ''

  if (typeof payload.output_text === 'string') return payload.output_text.trim()
  if (typeof payload.text === 'string') return payload.text.trim()

  const choiceText = payload.choices?.[0]?.message?.content
  if (typeof choiceText === 'string') return choiceText.trim()
  if (Array.isArray(choiceText)) {
    return choiceText
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join('')
      .trim()
  }

  const candidateText = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim()
  return candidateText || ''
}

export class AIService {
  constructor(options = {}) {
    this.store = options.store || null
    this.workspaceService = options.workspaceService || { getPath: () => '' }
    this.fetchImpl = options.fetchImpl || globalThis.fetch
  }

  getStore() {
    if (!this.store) {
      this.store = new Store({ name: 'ai-config' })
    }
    return this.store
  }

  setWorkspaceService(workspaceService) {
    this.workspaceService = workspaceService || { getPath: () => '' }
  }

  getConfig() {
    return normalizeConfig(this.getStore().get(CONFIG_KEY, blankConfig()))
  }

  saveConfig(config) {
    if (config?.provider && !PROVIDERS.has(config.provider)) {
      throw new Error('不支持的 AI 服务商')
    }
    const normalized = normalizeConfig({ ...this.getConfig(), ...config })
    this.getStore().set(CONFIG_KEY, normalized)
    return normalized
  }

  resetPrompt() {
    const config = this.getConfig()
    config.prompt = DEFAULT_AI_PROMPT
    this.getStore().set(CONFIG_KEY, config)
    return config
  }

  async testConnection(config = {}) {
    const providerConfig = config[config.provider]
    const providerName = config.provider === 'gemini' ? 'Gemini' : 'GLM'

    if (!providerConfig?.apiKey) {
      throw new Error(`请先填写 ${providerName} API Key`)
    }
    if (!providerConfig?.model) {
      throw new Error(`请先填写 ${providerName} 模型 ID`)
    }

    const testInput = {
      title: 'API 连接测试',
      description: '请仅回复 "Hello" 两个字母以确认 API 连接正常。'
    }

    if (config.provider === 'gemini') {
      const res = await this.callGemini(config, testInput, [])
      if (!res.text) {
        throw new Error('未返回有效数据')
      }
    } else {
      const res = await this.callGlm(config, testInput, [])
      if (!res.text) {
        throw new Error('未返回有效数据')
      }
    }

    return true
  }

  async generateThemeCopy(input = {}) {
    const config = this.getConfig()
    const providerConfig = config[config.provider]
    const providerName = config.provider === 'gemini' ? 'Gemini' : 'GLM'

    if (!providerConfig?.apiKey) {
      throw new Error(`请先在全局设置中填写 ${providerName} API Key`)
    }
    if (!providerConfig?.model) {
      throw new Error(`请先在全局设置中填写 ${providerName} 模型 ID`)
    }

    const imageParts = await this.readImageParts(input.images || [])
    if (config.provider === 'gemini') {
      return this.callGemini(config, input, imageParts)
    }
    return this.callGlm(config, input, imageParts)
  }

  async readImageParts(images) {
    const workspacePath = this.workspaceService.getPath()
    const selected = Array.isArray(images) ? images.slice(0, MAX_IMAGE_COUNT) : []
    const parts = []

    for (const image of selected) {
      const imagePath = getImagePath(image)
      if (!imagePath) continue
      if (!isAllowedImagePath(imagePath, workspacePath)) {
        throw new Error('图片不在当前工作区素材目录中')
      }

      const buffer = await fs.promises.readFile(imagePath)
      parts.push({
        mimeType: getImageMimeType(imagePath),
        data: buffer.toString('base64')
      })
    }

    return parts
  }

  buildRuntimeContext(input = {}, hasImages = false) {
    return [
      '【当前主题资料】',
      `主题标题：${cleanText(input.title) || '未命名主题'}`,
      `参考图片：${hasImages ? '已附加，请结合图片中的场景、人物情绪、色彩和光线生成。' : '未上传，请仅根据文字信息生成。'}`
    ].join('\n')
  }

  async callGemini(config, input, imageParts) {
    const text = `${config.prompt}\n\n${this.buildRuntimeContext(input, imageParts.length > 0)}`
    const body = {
      contents: [
        {
          parts: [
            { text },
            ...imageParts.map((image) => ({
              inlineData: {
                mimeType: image.mimeType,
                data: image.data
              }
            }))
          ]
        }
      ]
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent`
    const payload = await this.postJson(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': config.gemini.apiKey
      },
      body: JSON.stringify(body)
    })

    return { text: this.ensureGeneratedText('Gemini', payload) }
  }

  async callGlm(config, input, imageParts) {
    const userContent = [
      {
        type: 'text',
        text: this.buildRuntimeContext(input, imageParts.length > 0)
      },
      ...imageParts.map((image) => ({
        type: 'image_url',
        image_url: {
          url: `data:${image.mimeType};base64,${image.data}`
        }
      }))
    ]
    const body = {
      model: config.glm.model,
      stream: false,
      messages: [
        { role: 'system', content: config.prompt },
        { role: 'user', content: userContent }
      ]
    }

    const payload = await this.postJson(GLM_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${config.glm.apiKey}`
      },
      body: JSON.stringify(body)
    })

    return { text: this.ensureGeneratedText('GLM', payload) }
  }

  async postJson(url, options) {
    if (typeof this.fetchImpl !== 'function') {
      throw new Error('当前运行环境不支持网络请求')
    }

    const response = await this.fetchImpl(url, options)
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = payload?.error?.message || payload?.message || `请求失败 (${response.status})`
      throw new Error(message)
    }

    return payload
  }

  ensureGeneratedText(provider, payload) {
    const text = extractGeneratedText(provider, payload)
    if (!text) {
      throw new Error(`${provider} 未返回可用文案`)
    }
    return text
  }
}

export default new AIService()
