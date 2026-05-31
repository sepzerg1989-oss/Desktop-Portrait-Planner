<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-black/5 pb-4">
      <h2 class="text-sm font-bold text-morandi-text">色彩主题</h2>
      <p class="text-xs text-morandi-muted leading-relaxed mt-2 font-sans">
        为软件切换高奢艺术质感的主题风格。我们精选了 6 套经典的画册与莫兰迪色彩组合，点击即可丝滑过渡切换。
      </p>
    </div>

    <!-- Themes Grid Layout -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 select-none">
      <div 
        v-for="tpl in themes" 
        :key="tpl.id"
        @click="themeStore.setTheme(tpl.id)"
        class="group relative cursor-pointer p-5 flex flex-col justify-between rounded-none shadow-[0_4px_12px_rgba(0,0,0,0.01),0_16px_40px_rgba(0,0,0,0.03)] border transition-all duration-300"
        :class="[
          themeStore.currentTheme === tpl.id 
            ? 'border-morandi-text shadow-[inset_0_2px_8px_rgba(0,0,0,0.015),0_12px_36px_rgba(0,0,0,0.04)] bg-morandi-canvas/10' 
            : 'border-morandi-border/30 hover:border-morandi-border/80 bg-morandi-panel'
        ]"
      >
        <!-- 勾选指示器 (隐忍复选钩 ✓) -->
        <div 
          v-if="themeStore.currentTheme === tpl.id" 
          class="absolute top-4 right-4 text-morandi-text animate-fade-in font-serif font-bold text-xs"
        >
          ✓
        </div>

        <!-- 主题中英文名称 -->
        <div class="mb-4">
          <h3 class="text-sm text-morandi-text font-serif font-bold group-hover:text-morandi-red transition-colors">{{ tpl.name }}</h3>
          <p class="text-[10px] text-morandi-muted uppercase tracking-widest font-sans mt-0.5 scale-90 origin-left">{{ tpl.enName }}</p>
        </div>

        <!-- 调色盘视觉展示 (Overlap Circles) -->
        <div class="flex items-center space-x-2 mt-2">
          <!-- 画布底色圈 -->
          <div 
            class="w-6 h-6 rounded-full border border-morandi-border flex items-center justify-center shrink-0" 
            :style="{ backgroundColor: tpl.canvas }" 
            title="画布底色"
          >
            <!-- 嵌套面板色圈 -->
            <div 
              class="w-3.5 h-3.5 rounded-full border border-morandi-border shadow-xs" 
              :style="{ backgroundColor: tpl.paper }" 
              title="面板底色"
            ></div>
          </div>
          
          <!-- 文本墨色圈 -->
          <div 
            class="w-4 h-4 rounded-full border border-morandi-border shrink-0" 
            :style="{ backgroundColor: tpl.text }" 
            title="墨色文本"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useThemeStore } from '../../store/themeStore'

const themeStore = useThemeStore()

const themes = [
  { id: 'default', name: '暖调白棚', enName: 'The Daylight Studio', canvas: '#E5E0D8', paper: '#FCFBF9', text: '#2C2C2C' },
  { id: 'darkroom', name: '电影暗房', enName: 'The Cinematic Darkroom', canvas: '#121212', paper: '#1E1E1E', text: '#E5E0D8' },
  { id: 'gallery', name: '现代画廊', enName: 'The Plaster Gallery', canvas: '#F5F5F7', paper: '#FFFFFF', text: '#1A1A1A' },
  { id: 'sage', name: '灰绿鼠尾草', enName: 'The Botanist', canvas: '#D1D5D0', paper: '#F4F5F3', text: '#2E362D' },
  { id: 'rose', name: '枯玫瑰', enName: 'The Romantic', canvas: '#D9CECD', paper: '#FAF7F6', text: '#4A3C3B' },
  { id: 'haze', name: '雾霾蓝', enName: 'The Melancholy', canvas: '#C6CDD3', paper: '#F2F4F7', text: '#2B323A' }
]
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
