<template>
  <div class="space-y-6">
    <div class="border-b border-morandi-border pb-4">
      <h2 class="text-sm font-bold text-morandi-text">AI 创意</h2>
      <p class="text-xs text-morandi-muted leading-relaxed mt-2 font-sans">
        配置用于主题文案生成的大模型服务。API Key 与提示词仅保存于本机配置中，生成请求会在本机主进程发起。
      </p>
    </div>

    <section class="space-y-5">
      <div>
        <div class="text-[10px] text-morandi-muted uppercase tracking-widest mb-3 font-bold font-sans">服务商 / PROVIDER</div>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="item in providers"
            :key="item.id"
            type="button"
            @click="config.provider = item.id"
            class="py-2.5 border text-[10px] uppercase tracking-widest rounded-full transition-all outline-none font-medium"
            :class="config.provider === item.id
              ? 'bg-morandi-text text-morandi-canvas border-morandi-text shadow-sm'
              : 'bg-transparent text-morandi-muted border-morandi-border hover:text-morandi-text hover:border-morandi-text'"
          >
            {{ item.name }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5">
        <Transition name="fade" mode="out-in">
          <div :key="config.provider" class="space-y-5">
            <template v-if="config.provider === 'gemini'">
              <div>
                <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">Gemini 模型 / GEMINI MODEL</label>
                <input
                  v-model="config.gemini.model"
                  type="text"
                  class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-xs text-morandi-text rounded-none font-mono"
                  placeholder="gemini-3.5-flash"
                />
              </div>
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-[10px] uppercase tracking-wider text-morandi-muted font-bold">Gemini API Key</label>
                  <button
                    type="button"
                    @click="showGeminiKey = !showGeminiKey"
                    class="text-[9px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors outline-none"
                  >
                    {{ showGeminiKey ? '隐藏' : '显示' }}
                  </button>
                </div>
                <input
                  v-model="config.gemini.apiKey"
                  :type="showGeminiKey ? 'text' : 'password'"
                  class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-xs text-morandi-text rounded-none font-mono"
                  placeholder="Google AI Studio API Key"
                />
              </div>
            </template>

            <template v-else>
              <div>
                <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">GLM 模型 / GLM MODEL</label>
                <input
                  v-model="config.glm.model"
                  type="text"
                  class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-xs text-morandi-text rounded-none font-mono"
                  placeholder="GLM-4V-Flash"
                />
              </div>
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-[10px] uppercase tracking-wider text-morandi-muted font-bold">GLM API Key</label>
                  <button
                    type="button"
                    @click="showGlmKey = !showGlmKey"
                    class="text-[9px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors outline-none"
                  >
                    {{ showGlmKey ? '隐藏' : '显示' }}
                  </button>
                </div>
                <input
                  v-model="config.glm.apiKey"
                  :type="showGlmKey ? 'text' : 'password'"
                  class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-xs text-morandi-text rounded-none font-mono"
                  placeholder="GLM API Key"
                />
              </div>
            </template>
          </div>
        </Transition>
      </div>

      <!-- API 申请指南 (方案二折叠面板) -->
      <div class="mt-4 border-t border-morandi-border/40 pt-4">
        <button
          type="button"
          @click="showGuide = !showGuide"
          class="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors outline-none font-bold"
        >
          <span>API 申请指南</span>
          <span class="transform transition-transform duration-200" :class="{ 'rotate-180': showGuide }">↓</span>
        </button>

        <Transition name="fade">
          <div v-show="showGuide" class="mt-3 p-3.5 border border-dashed border-morandi-border/60 bg-morandi-text/[0.015] rounded-lg space-y-3">
            <div v-if="config.provider === 'gemini'" class="text-[10px] text-morandi-muted leading-relaxed font-sans space-y-1.5">
              <p class="font-bold text-morandi-text">Google Gemini API 申请步骤：</p>
              <p>1. 准备好网络代理环境，访问 <a href="#" @click.prevent="openLink('https://aistudio.google.com/')" class="text-morandi-text underline hover:opacity-80">Google AI Studio 控制台 ↗</a> 并登录谷歌账号。</p>
              <p>2. 点击左侧导航栏的 <span class="text-morandi-text font-medium">"Get API key"</span> 按钮。</p>
              <p>3. 点击 <span class="text-morandi-text font-medium">"Create API key"</span>，选择或新建谷歌云项目，生成密钥并复制到上方输入框。</p>
              <p class="text-[9px] text-morandi-muted/80 mt-1">※ 提示：Gemini-3.5-Flash 等模型提供个人免费限额，日常拍摄策划使用完全足够。</p>
            </div>
            <div v-else class="text-[10px] text-morandi-muted leading-relaxed font-sans space-y-1.5">
              <p class="font-bold text-morandi-text">智谱 GLM API 申请步骤：</p>
              <p>1. 访问 <a href="#" @click.prevent="openLink('https://open.bigmodel.cn/')" class="text-morandi-text underline hover:opacity-80">智谱 AI 开放平台 ↗</a> 并注册/登录账号。</p>
              <p>2. 进入右上方“控制台”，并在左侧菜单选择 <span class="text-morandi-text font-medium">"API Keys"</span> 页面。</p>
              <p>3. 点击页面中的 <span class="text-morandi-text font-medium">"添加新的 API Key"</span>，创建并复制生成的密钥填入上方输入框。</p>
              <p class="text-[9px] text-morandi-muted/80 mt-1">※ 提示：智谱为新注册账户提供了免费的体验 Token 额度，过期后可根据生成字数小额充值。</p>
            </div>
          </div>
        </Transition>
      </div>
    </section>

    <section class="space-y-3 pt-2">
      <div class="flex items-center justify-between gap-4">
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted font-bold">默认提示词 / DEFAULT PROMPT</label>
        <button
          type="button"
          @click="handleResetPrompt"
          class="shrink-0 text-[10px] uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors outline-none"
        >
          恢复默认提示词
        </button>
      </div>
      <textarea
        v-model="config.prompt"
        rows="8"
        class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-xs text-morandi-text rounded-none resize-none leading-relaxed scroll-thin"
      ></textarea>
    </section>

    <div v-if="status.message" class="bg-transparent text-morandi-text text-[10px] p-4 border border-morandi-border animate-fade-in flex items-center font-sans">
      <span class="mr-2" :class="status.type === 'error' ? 'text-morandi-red' : 'text-morandi-text'">{{ status.type === 'error' ? '✕' : '✓' }}</span>
      {{ status.message }}
    </div>

    <div class="flex justify-end items-center gap-3 pt-2">
      <button
        type="button"
        @click="handleTestConnection"
        :disabled="isTesting || isSaving"
        class="px-6 py-2 border border-morandi-border text-morandi-text text-[10px] sm:text-[11px] uppercase tracking-widest rounded-full hover:bg-morandi-border/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none font-medium"
      >
        {{ isTesting ? '测试中...' : '测试连接' }}
      </button>
      <button
        type="button"
        @click="handleSave"
        :disabled="isSaving || isTesting"
        class="px-8 py-2 bg-morandi-text text-morandi-canvas text-[10px] sm:text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none shadow-sm font-medium"
      >
        {{ isSaving ? '保存中...' : '保存配置' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'

const providers = [
  { id: 'gemini', name: 'Gemini' },
  { id: 'glm', name: 'GLM' }
]

const config = reactive({
  provider: 'gemini',
  gemini: { model: 'gemini-3.5-flash', apiKey: '' },
  glm: { model: 'GLM-4V-Flash', apiKey: '' },
  prompt: ''
})

const isSaving = ref(false)
const isTesting = ref(false)
const showGeminiKey = ref(false)
const showGlmKey = ref(false)
const showGuide = ref(false)

const status = reactive({
  type: '',
  message: ''
})

const applyConfig = (nextConfig) => {
  config.provider = nextConfig.provider
  config.gemini.model = nextConfig.gemini?.model || 'gemini-3.5-flash'
  config.gemini.apiKey = nextConfig.gemini?.apiKey || ''
  config.glm.model = nextConfig.glm?.model || 'GLM-4V-Flash'
  config.glm.apiKey = nextConfig.glm?.apiKey || ''
  config.prompt = nextConfig.prompt || ''
}

const showStatus = (type, message) => {
  status.type = type
  status.message = message
  setTimeout(() => {
    if (status.message === message) {
      status.type = ''
      status.message = ''
    }
  }, 3500)
}

const handleSave = async () => {
  isSaving.value = true
  try {
    const saved = await window.electronAPI.ai.saveConfig(JSON.parse(JSON.stringify(config)))
    applyConfig(saved)
    showStatus('success', 'AI 创意配置已保存。')
  } catch (err) {
    showStatus('error', err.message || '保存失败')
  } finally {
    isSaving.value = false
  }
}

const handleResetPrompt = async () => {
  try {
    const saved = await window.electronAPI.ai.resetPrompt()
    applyConfig(saved)
    showStatus('success', '提示词已恢复为默认版本。')
  } catch (err) {
    showStatus('error', err.message || '恢复失败')
  }
}

const handleTestConnection = async () => {
  isTesting.value = true
  showStatus('', '')
  try {
    const res = await window.electronAPI.ai.testConnection(JSON.parse(JSON.stringify(config)))
    if (res === true) {
      showStatus('success', 'API 连接测试成功！通道配置工作正常。')
    }
  } catch (err) {
    showStatus('error', `API 连接失败: ${err.message || err}`)
  } finally {
    isTesting.value = false
  }
}

const openLink = (url) => {
  window.electronAPI.openExternal(url)
}

onMounted(async () => {
  try {
    const saved = await window.electronAPI.ai.getConfig()
    applyConfig(saved)
  } catch (err) {
    showStatus('error', err.message || '读取 AI 配置失败')
  }
})
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
