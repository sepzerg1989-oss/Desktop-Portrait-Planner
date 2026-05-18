<script setup>
import { useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import TopHeader from './components/TopHeader.vue'
import TitleBar from './components/common/TitleBar.vue'

const route = useRoute()
const isMac = ref(false)

onMounted(() => {
  isMac.value = window.navigator.platform.toUpperCase().indexOf('MAC') >= 0
})
</script>

<template>
  <div class="h-screen bg-morandi-canvas flex flex-col overflow-hidden" @dragover.prevent @drop.prevent>
    <TitleBar />

    <!-- 仅在大厅/资源库页面显示全局头，进入策划案后隐藏以实现沉浸式编辑 -->
    <TopHeader v-if="route.path !== '/editor'" :style="{ marginTop: isMac ? '0px' : '0' }" />
    
    <!-- 核心视图渲染区 -->
    <main class="flex-1 overflow-hidden relative">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
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
</style>
