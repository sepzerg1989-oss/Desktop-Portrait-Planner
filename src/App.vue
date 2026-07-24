<script setup>
import { useRoute } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import TopHeader from './components/TopHeader.vue'
import TitleBar from './components/common/TitleBar.vue'
import UpdatePromptModal from './components/common/UpdatePromptModal.vue'
import CloseToBackgroundModal from './components/common/CloseToBackgroundModal.vue'
import { useThemeStore } from './store/themeStore'

const route = useRoute()
const isMac = ref(false)
const themeStore = useThemeStore()
const showCloseNotice = ref(false)
const closeNoticeTarget = ref('系统托盘')
let cleanupCloseNotice = null

onMounted(() => {
  themeStore.initTheme()
  isMac.value = window.navigator.platform.toUpperCase().indexOf('MAC') >= 0

  if (window.electronAPI?.appBehavior?.onCloseNotice) {
    cleanupCloseNotice = window.electronAPI.appBehavior.onCloseNotice((payload) => {
      closeNoticeTarget.value = payload?.backgroundTargetLabel || '系统托盘'
      showCloseNotice.value = true
    })
  }
})

onUnmounted(() => {
  if (cleanupCloseNotice) cleanupCloseNotice()
})

const resolveCloseNotice = async (action, payload) => {
  showCloseNotice.value = false
  await window.electronAPI.appBehavior.resolveCloseNotice({
    action,
    dontShowAgain: payload?.dontShowAgain === true
  })
}
</script>

<template>
  <div class="h-screen bg-morandi-canvas flex flex-col overflow-hidden" @dragover.prevent @drop.prevent>
    <TitleBar />

    <!-- 仅在大厅/资源库页面显示全局头，进入策划案后隐藏以实现沉浸式编辑 -->
    <transition name="slide-header">
      <TopHeader v-if="route.path !== '/editor'" :style="{ marginTop: isMac ? '0px' : '0' }" />
    </transition>
    
    <!-- 核心视图渲染区 -->
    <main class="flex-1 overflow-hidden relative">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 自动更新弹窗组件 -->
    <UpdatePromptModal />

    <CloseToBackgroundModal
      :show="showCloseNotice"
      :target-label="closeNoticeTarget"
      @hide="resolveCloseNotice('hide', $event)"
      @quit="resolveCloseNotice('quit', $event)"
    />
  </div>
</template>

<style>
/* 简单的路由切换过渡动画，符合杂志优雅感 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 页头滑出渐隐动画 */
.slide-header-enter-active,
.slide-header-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  white-space: nowrap;
}

.slide-header-enter-from,
.slide-header-leave-to {
  height: 0 !important;
  opacity: 0;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  border-bottom-width: 0 !important;
}
</style>
