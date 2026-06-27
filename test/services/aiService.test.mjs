import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { AIService, DEFAULT_AI_PROMPT } from '../../electron/services/AIService.js'

class MemoryStore {
  constructor(seed = {}) {
    this.values = new Map(Object.entries(seed))
  }

  get(key, fallback) {
    return this.values.has(key) ? this.values.get(key) : fallback
  }

  set(key, value) {
    this.values.set(key, value)
  }
}

function createService(options = {}) {
  const store = options.store || new MemoryStore()
  const workspacePath = options.workspacePath || ''
  const workspaceService = {
    getPath: () => workspacePath
  }
  const fetchImpl = options.fetchImpl || (async () => ({
    ok: true,
    json: async () => ({ output_text: 'AI 生成文案' })
  }))

  return new AIService({ store, workspaceService, fetchImpl })
}

test('AI config returns defaults and never overwrites custom prompt', () => {
  const store = new MemoryStore()
  const service = createService({ store })

  assert.deepEqual(service.getConfig(), {
    provider: 'gemini',
    gemini: { model: 'gemini-3.5-flash', apiKey: '' },
    glm: { model: 'GLM-4V-Flash', apiKey: '' },
    prompt: DEFAULT_AI_PROMPT
  })

  service.saveConfig({
    provider: 'glm',
    gemini: { model: 'gemini-custom', apiKey: ' gem-key ' },
    glm: { model: 'glm-custom', apiKey: ' glm-key ' },
    prompt: '请写得更像独立摄影画册'
  })

  assert.deepEqual(service.getConfig(), {
    provider: 'glm',
    gemini: { model: 'gemini-custom', apiKey: 'gem-key' },
    glm: { model: 'glm-custom', apiKey: 'glm-key' },
    prompt: '请写得更像独立摄影画册'
  })

  service.resetPrompt()
  assert.equal(service.getConfig().prompt, DEFAULT_AI_PROMPT)
})

test('AI config rejects invalid provider', () => {
  const service = createService()

  assert.throws(
    () => service.saveConfig({ provider: 'other' }),
    /不支持的 AI 服务商/
  )
})

test('generateThemeCopy rejects missing credentials', async () => {
  const service = createService()

  await assert.rejects(
    () => service.generateThemeCopy({ title: '晨光人像', description: '', images: [] }),
    /请先在全局设置中填写 Gemini API Key/
  )
})

test('blank GLM model falls back to GLM-4V-Flash default', async () => {
  const calls = []
  const service = createService({
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '默认 GLM 模型文案。' } }]
        })
      }
    }
  })
  service.saveConfig({ provider: 'glm', glm: { model: '   ', apiKey: 'glm-key' } })

  const result = await service.generateThemeCopy({ title: '晨光人像', description: '', images: [] })
  const payload = JSON.parse(calls[0].options.body)

  assert.equal(result.text, '默认 GLM 模型文案。')
  assert.equal(payload.model, 'GLM-4V-Flash')
})

test('builds Gemini request with custom prompt and inline images', async () => {
  const workspacePath = fs.mkdtempSync(path.join(os.tmpdir(), 'portrait-ai-'))
  const imageDir = path.join(workspacePath, 'images', 'plans', '1')
  fs.mkdirSync(imageDir, { recursive: true })
  const imagePath = path.join(imageDir, 'theme.jpg')
  fs.writeFileSync(imagePath, Buffer.from([1, 2, 3, 4]))

  const calls = []
  const service = createService({
    workspacePath,
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  { text: '午后窗边的情绪人像。' }
                ]
              }
            }
          ]
        })
      }
    }
  })

  service.saveConfig({
    provider: 'gemini',
    gemini: { model: 'gemini-test', apiKey: 'gem-key' },
    prompt: '自定义提示词'
  })

  const result = await service.generateThemeCopy({
    title: '窗边午后',
    description: '复古、柔和',
    images: [{ path: imagePath }]
  })

  assert.equal(result.text, '午后窗边的情绪人像。')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent')
  assert.equal(calls[0].options.headers['x-goog-api-key'], 'gem-key')

  const payload = JSON.parse(calls[0].options.body)
  assert.match(payload.contents[0].parts[0].text, /自定义提示词/)
  assert.match(payload.contents[0].parts[0].text, /窗边午后/)
  assert.equal(payload.contents[0].parts[1].inlineData.mimeType, 'image/jpeg')
  assert.equal(payload.contents[0].parts[1].inlineData.data, Buffer.from([1, 2, 3, 4]).toString('base64'))
})

test('builds GLM request using OpenAI-compatible multimodal content', async () => {
  const calls = []
  const service = createService({
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '一段 GLM 生成的策划文案。' } }]
        })
      }
    }
  })

  service.saveConfig({
    provider: 'glm',
    glm: { model: 'glm-test', apiKey: 'glm-key' },
    prompt: 'GLM 提示词'
  })

  const result = await service.generateThemeCopy({
    title: '雨夜霓虹',
    description: '',
    images: []
  })

  assert.equal(result.text, '一段 GLM 生成的策划文案。')
  assert.equal(calls[0].url, 'https://api.z.ai/api/paas/v4/chat/completions')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer glm-key')

  const payload = JSON.parse(calls[0].options.body)
  assert.equal(payload.model, 'glm-test')
  assert.equal(payload.stream, false)
  assert.equal(payload.messages[0].role, 'system')
  assert.match(payload.messages[0].content, /GLM 提示词/)
  assert.equal(payload.messages[1].role, 'user')
  assert.equal(payload.messages[1].content[0].type, 'text')
  assert.match(payload.messages[1].content[0].text, /雨夜霓虹/)
})

test('generateThemeCopy rejects images outside workspace image folder', async () => {
  const workspacePath = fs.mkdtempSync(path.join(os.tmpdir(), 'portrait-ai-'))
  const outsideImage = path.join(os.tmpdir(), `outside-${Date.now()}.jpg`)
  fs.writeFileSync(outsideImage, Buffer.from([1, 2, 3]))

  const service = createService({ workspacePath })
  service.saveConfig({
    provider: 'gemini',
    gemini: { model: 'gemini-test', apiKey: 'gem-key' }
  })

  await assert.rejects(
    () => service.generateThemeCopy({
      title: '越界图片',
      description: '',
      images: [{ path: outsideImage }]
    }),
    /图片不在当前工作区素材目录中/
  )
})

test('testConnection validates missing credentials', async () => {
  const service = createService()
  
  await assert.rejects(
    () => service.testConnection({ provider: 'gemini', gemini: { apiKey: '', model: 'gemini-3.5-flash' } }),
    /请先填写 Gemini API Key/
  )
  await assert.rejects(
    () => service.testConnection({ provider: 'gemini', gemini: { apiKey: 'key', model: '' } }),
    /请先填写 Gemini 模型 ID/
  )
})

test('testConnection returns true on successful API ping', async () => {
  const service = createService({
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Hello' }] } }]
      })
    })
  })

  const result = await service.testConnection({
    provider: 'gemini',
    gemini: { apiKey: 'valid-key', model: 'gemini-test' },
    prompt: '默认提示'
  })

  assert.equal(result, true)
})
