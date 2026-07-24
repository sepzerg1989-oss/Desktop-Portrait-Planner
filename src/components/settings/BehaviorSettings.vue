<template>
  <div class="space-y-6">
    <div class="border-b border-morandi-border pb-4">
      <h2 class="text-sm font-bold text-morandi-text">应用行为</h2>
      <p class="text-xs text-morandi-muted leading-relaxed mt-2 font-sans">
        管理 Portrait Planner 与操作系统之间的关系，包括关闭窗口后的去向与开机启动。
      </p>
    </div>

    <section class="space-y-4">
      <div class="py-2">
        <div class="flex items-center justify-between gap-5">
          <div>
            <div class="text-[10px] text-morandi-muted uppercase tracking-widest mb-2 font-bold font-sans">关闭窗口时 / CLOSE WINDOW</div>
            <p class="text-xs text-morandi-muted leading-relaxed font-sans">
              {{ closeBehaviorCopy }}
            </p>
          </div>
          <button
            type="button"
            @click="toggleCloseBehavior"
            class="relative w-11 h-6 rounded-full border transition-all shrink-0 outline-none"
            :class="isCloseToBackground
              ? 'bg-morandi-text border-morandi-text'
              : 'bg-transparent border-morandi-border'"
            :aria-pressed="isCloseToBackground"
          >
            <span
              class="absolute top-1 left-1 w-4 h-4 rounded-full transition-all"
              :class="isCloseToBackground
                ? 'translate-x-5 bg-morandi-canvas'
                : 'translate-x-0 bg-morandi-muted'"
            ></span>
          </button>
        </div>
      </div>

      <div class="pt-4 border-t border-morandi-border/50">
        <div class="flex items-center justify-between gap-5">
          <div>
            <div class="text-[10px] text-morandi-muted uppercase tracking-widest mb-2 font-bold font-sans">开机自动启动 / AUTO LAUNCH</div>
            <p class="text-xs text-morandi-muted leading-relaxed font-sans">
              开启后，系统登录时会自动启动 Portrait Planner。此设置写入系统登录项，下一次开机生效。
            </p>
          </div>
          <button
            type="button"
            @click="toggleAutoLaunch"
            class="relative w-11 h-6 rounded-full border transition-all shrink-0 outline-none"
            :class="settings.autoLaunch
              ? 'bg-morandi-text border-morandi-text'
              : 'bg-transparent border-morandi-border'"
            :aria-pressed="settings.autoLaunch"
          >
            <span
              class="absolute top-1 left-1 w-4 h-4 rounded-full transition-all"
              :class="settings.autoLaunch
                ? 'translate-x-5 bg-morandi-canvas'
                : 'translate-x-0 bg-morandi-muted'"
            ></span>
          </button>
        </div>
      </div>

    </section>

    <div v-if="status.message" class="bg-transparent text-morandi-text text-[10px] p-4 border border-morandi-border animate-fade-in flex items-center font-sans">
      <span class="mr-2" :class="status.type === 'error' ? 'text-morandi-red' : 'text-morandi-text'">{{ status.type === 'error' ? '✕' : '✓' }}</span>
      {{ status.message }}
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'

const settings = reactive({
  closeBehavior: 'tray',
  showCloseToTrayNotice: true,
  autoLaunch: false
})

const capabilities = reactive({
  platform: '',
  backgroundTargetLabel: '系统托盘',
  closeToBackgroundLabel: '关闭窗口后收进系统托盘'
})

const status = reactive({
  type: '',
  message: ''
})

const applySettings = (nextSettings) => {
  settings.closeBehavior = nextSettings.closeBehavior || 'tray'
  settings.showCloseToTrayNotice = nextSettings.showCloseToTrayNotice !== false
  settings.autoLaunch = nextSettings.autoLaunch === true
}

const applyCapabilities = (nextCapabilities) => {
  Object.assign(capabilities, nextCapabilities || {})
}

const showStatus = (type, message) => {
  status.type = type
  status.message = message
  setTimeout(() => {
    if (status.message === message) {
      status.type = ''
      status.message = ''
    }
  }, 3000)
}

const saveSettings = async (patch) => {
  try {
    const saved = await window.electronAPI.appBehavior.saveSettings({
      ...settings,
      ...patch
    })
    applySettings(saved)
    showStatus('success', '应用行为设置已即时生效。')
  } catch (err) {
    showStatus('error', err.message || '设置保存失败')
  }
}

const isCloseToBackground = computed(() => settings.closeBehavior === 'tray')

const closeBehaviorCopy = computed(() => {
  if (isCloseToBackground.value) {
    return `关闭窗口后继续运行，可从${capabilities.backgroundTargetLabel || '系统托盘'}重新打开。`
  }
  return '关闭主窗口时直接结束进程，下次启动时重新进入应用。'
})

const toggleCloseBehavior = () => {
  saveSettings({ closeBehavior: isCloseToBackground.value ? 'quit' : 'tray' })
}

const toggleAutoLaunch = () => {
  saveSettings({ autoLaunch: !settings.autoLaunch })
}

onMounted(async () => {
  try {
    const [savedSettings, savedCapabilities] = await Promise.all([
      window.electronAPI.appBehavior.getSettings(),
      window.electronAPI.appBehavior.getCapabilities()
    ])
    applySettings(savedSettings)
    applyCapabilities(savedCapabilities)
  } catch (err) {
    showStatus('error', err.message || '读取应用行为设置失败')
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
</style>
