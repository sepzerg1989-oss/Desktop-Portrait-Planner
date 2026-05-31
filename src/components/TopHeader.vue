<template>
  <header 
    class="h-16 bg-morandi-canvas flex items-center px-8 sticky top-0 z-50 border-b border-morandi-border/30 transition-all"
    @mouseleave="closeMega"
  >
    
    <!-- 左侧 Logo -->
    <div class="flex-1 flex items-center">
      <div class="font-serif text-lg tracking-[0.5em] uppercase text-morandi-text leading-none pt-1 select-none">
        Portrait Planner
      </div>
    </div>

    <!-- 中间 导航栏 (文字居中) -->
    <nav class="flex-none flex justify-center space-x-12 relative h-full items-center">
      <router-link 
        to="/" 
        class="text-xs font-medium transition-colors hover:text-morandi-text relative py-2 tracking-widest outline-none"
        :class="[ route.path === '/' ? 'text-morandi-text' : 'text-morandi-muted' ]"
        @mouseenter="closeMega"
      >
        我的策划
        <span v-if="route.path === '/'" class="absolute bottom-0 left-0 w-full h-[1px] bg-morandi-text"></span>
      </router-link>

      <!-- 素材档案巨型面板触发器 -->
      <div 
        class="text-xs font-medium transition-colors hover:text-morandi-text relative py-2 tracking-widest cursor-pointer select-none outline-none flex items-center gap-1"
        :class="[ isLibraryActive ? 'text-morandi-text' : 'text-morandi-muted' ]"
        @mouseenter="openMega"
      >
        <span>素材档案</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-3 w-3 transition-transform duration-300"
          :class="{ 'rotate-180': isMegaOpen }" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        <span v-if="isLibraryActive" class="absolute bottom-0 left-0 w-full h-[1px] bg-morandi-text"></span>
      </div>
    </nav>

    <!-- 右侧 操作区 (与左侧 flex-1 对应保持中间绝对居中) -->
    <div class="flex-1 flex items-center justify-end space-x-4">
      <router-link 
        to="/settings"
        class="px-6 py-2 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity font-medium outline-none"
        @mouseenter="closeMega"
      >
        全局设置
      </router-link>
    </div>

    <!-- 巨型悬浮面板 (Mega Dropdown) -->
    <transition name="slide-fade">
      <div 
        v-if="isMegaOpen" 
        class="absolute top-16 left-0 w-full bg-morandi-paper border-b border-morandi-border/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.04)] z-50 flex items-stretch justify-between"
        @mouseenter="openMega"
        @mouseleave="closeMega"
      >
        <!-- 左侧文字目录 (带优雅 padding) -->
        <div class="flex-1 py-10 pl-16 pr-8 flex justify-center">
          <div class="w-full max-w-4xl grid grid-cols-2 gap-16">
            <!-- 第一列：人物与造型 -->
            <div>
              <h3 class="inline-block text-[10px] font-sans text-morandi-muted uppercase tracking-[0.25em] mb-6 select-none pb-2 border-b border-morandi-border/30">
                人物与造型 / PORTRAITS & STYLING
              </h3>
              <div class="space-y-4">
                <div 
                  class="group flex items-center cursor-pointer select-none py-1.5 px-2 hover:bg-morandi-text/5 transition-colors rounded-[2px]"
                  @mouseenter="selectItem('models')"
                  @click="navigateTo('/models')"
                >
                  <span class="font-serif text-sm tracking-wider text-morandi-text group-hover:text-morandi-red transition-colors">模特档案</span>
                </div>
                
                <div 
                  class="group flex items-center cursor-pointer select-none py-1.5 px-2 hover:bg-morandi-text/5 transition-colors rounded-[2px]"
                  @mouseenter="selectItem('makeup')"
                  @click="navigateTo('/makeup')"
                >
                  <span class="font-serif text-sm tracking-wider text-morandi-text group-hover:text-morandi-red transition-colors">妆面造型</span>
                </div>

                <div 
                  class="group flex items-center cursor-pointer select-none py-1.5 px-2 hover:bg-morandi-text/5 transition-colors rounded-[2px]"
                  @mouseenter="selectItem('clothing')"
                  @click="navigateTo('/clothing')"
                >
                  <span class="font-serif text-sm tracking-wider text-morandi-text group-hover:text-morandi-red transition-colors">服装搭配</span>
                </div>
              </div>
            </div>

            <!-- 第二列：空间与物品 -->
            <div>
              <h3 class="inline-block text-[10px] font-sans text-morandi-muted uppercase tracking-[0.25em] mb-6 select-none pb-2 border-b border-morandi-border/30">
                空间与物品 / SPACES & ITEMS
              </h3>
              <div class="space-y-4">
                <div 
                  class="group flex items-center cursor-pointer select-none py-1.5 px-2 hover:bg-morandi-text/5 transition-colors rounded-[2px]"
                  @mouseenter="selectItem('locations')"
                  @click="navigateTo('/locations')"
                >
                  <span class="font-serif text-sm tracking-wider text-morandi-text group-hover:text-morandi-red transition-colors">场地堪景</span>
                </div>

                <div 
                  class="group flex items-center cursor-pointer select-none py-1.5 px-2 hover:bg-morandi-text/5 transition-colors rounded-[2px]"
                  @mouseenter="selectItem('props')"
                  @click="navigateTo('/props')"
                >
                  <span class="font-serif text-sm tracking-wider text-morandi-text group-hover:text-morandi-red transition-colors">道具中心</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧摄影艺术橱窗 (全出血，高与面板齐高，完全撑满不留白) -->
        <div class="w-[360px] h-[300px] shrink-0 relative overflow-hidden bg-morandi-canvas/10 group/frame">
          <transition name="fade" mode="out-in">
            <img 
              :key="showcaseImage"
              :src="showcaseImage" 
              class="w-full h-full object-cover transition-transform duration-[1000ms] ease-out group-hover/frame:scale-105" 
            />
          </transition>
          <!-- 左侧高奢渐变融化遮罩：消除生硬边缘，平滑融入文字菜单底色 -->
          <div class="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-morandi-paper via-morandi-paper/40 to-transparent pointer-events-none z-10"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
        </div>
      </div>
    </transition>

  </header>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isMegaOpen = ref(false)
const activeItem = ref('models')

let leaveTimer = null

onBeforeUnmount(() => {
  if (leaveTimer) clearTimeout(leaveTimer)
})

const openMega = () => {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
  isMegaOpen.value = true
}

const closeMega = () => {
  if (leaveTimer) clearTimeout(leaveTimer)
  leaveTimer = setTimeout(() => {
    isMegaOpen.value = false
  }, 200)
}

const selectItem = (item) => {
  activeItem.value = item
}

const navigateTo = (path) => {
  isMegaOpen.value = false
  router.push(path)
}

// 动态橱窗图片路径
const showcaseImage = computed(() => {
  const map = {
    models: './showcase_models.png',
    makeup: './showcase_makeup.png',
    clothing: './showcase_clothing.png',
    locations: './showcase_locations.png',
    props: './showcase_props.png'
  }
  return map[activeItem.value] || './showcase_models.png'
})

// 检查当前是否激活了素材库下的任何页面
const isLibraryActive = computed(() => {
  const libPaths = ['/models', '/locations', '/clothing', '/props', '/makeup']
  return libPaths.includes(route.path)
})
</script>

<style scoped>
/* 优雅下推淡入淡出动画 */
.slide-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 橱窗大图切换淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
