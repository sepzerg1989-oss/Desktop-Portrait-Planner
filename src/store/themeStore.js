import { defineStore } from 'pinia'

const themeBgColorMap = {
  default: '#E5E0D8',
  darkroom: '#121212',
  gallery: '#F5F5F7',
  sage: '#D1D5D0',
  rose: '#D9CECD',
  haze: '#C6CDD3'
}

/**
 * 莫兰迪多主题状态管理 Store
 */
export const useThemeStore = defineStore('theme', {
  state: () => ({
    currentTheme: 'default',
    themes: [
      { id: 'default', name: '暖调白棚 (Daylight Studio)' },
      { id: 'darkroom', name: '电影暗房 (Cinematic Darkroom)' },
      { id: 'gallery', name: '现代画廊 (Plaster Gallery)' },
      { id: 'sage', name: '灰绿鼠尾草 (The Botanist)' },
      { id: 'rose', name: '枯玫瑰 (The Romantic)' },
      { id: 'haze', name: '雾霾蓝 (The Melancholy)' }
    ]
  }),
  actions: {
    /** 初始化并恢复主题 */
    async initTheme() {
      // 1. 同步首选：从 localStorage 读取，消除加载闪烁
      let saved = localStorage.getItem('morandi-theme') || 'default'
      this.currentTheme = saved
      this.applyThemeToDOM(saved)

      // 2. 异步兜底同步至主进程，保证与 Electron 配置一致
      try {
        if (window.electronAPI && window.electronAPI.theme) {
          const mainSaved = await window.electronAPI.theme.getSavedTheme()
          if (mainSaved && mainSaved !== saved) {
            this.currentTheme = mainSaved
            localStorage.setItem('morandi-theme', mainSaved)
            this.applyThemeToDOM(mainSaved)
            
            // 同步底层窗口背景色
            const bgColor = themeBgColorMap[mainSaved] || '#E5E0D8'
            window.electronAPI.theme.setBackgroundColor(bgColor)
          } else {
            // 如果二者一致，也主动触发一次窗口背景色同步（防止边界重置）
            const bgColor = themeBgColorMap[saved] || '#E5E0D8'
            window.electronAPI.theme.setBackgroundColor(bgColor)
          }
        }
      } catch (e) {
        console.error('[themeStore] 从主进程同步主题失败:', e)
      }
    },

    /** 切换主题 */
    setTheme(themeName) {
      if (!themeBgColorMap[themeName]) return
      
      this.currentTheme = themeName
      localStorage.setItem('morandi-theme', themeName)
      this.applyThemeToDOM(themeName)

      // 同步到 Electron 主进程
      if (window.electronAPI && window.electronAPI.theme) {
        // 保存配置
        window.electronAPI.theme.saveTheme(themeName)
        // 同步窗口底色，防止拉伸和窗口加载闪动
        const bgColor = themeBgColorMap[themeName]
        window.electronAPI.theme.setBackgroundColor(bgColor)
      }
    },

    /** 挂载 theme 属性到根节点 */
    applyThemeToDOM(themeName) {
      document.documentElement.setAttribute('data-theme', themeName)
    }
  }
})
