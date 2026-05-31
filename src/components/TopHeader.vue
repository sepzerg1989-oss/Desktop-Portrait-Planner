<template>
  <header class="h-16 bg-morandi-canvas flex items-center px-8 sticky top-0 z-50 border-b border-morandi-border/30 transition-all">
    
    <!-- 左侧 Logo -->
    <div class="flex-1 flex items-center">
      <div class="font-serif text-lg tracking-[0.5em] uppercase text-morandi-text leading-none pt-1">
        Portrait Planner
      </div>
    </div>

    <!-- 中间 导航栏 (文字居中要求) -->
    <nav class="flex-none flex justify-center space-x-10">
      <router-link 
        to="/" 
        class="text-xs font-medium transition-colors hover:text-morandi-text relative py-2 tracking-widest"
        :class="[ $route.path === '/' ? 'text-morandi-text' : 'text-morandi-muted' ]"
      >
        策划
        <span v-if="$route.path === '/'" class="absolute bottom-0 left-0 w-full h-[1.5px] bg-morandi-text"></span>
      </router-link>

      <router-link 
        to="/models" 
        class="text-xs font-medium transition-colors hover:text-morandi-text relative py-2 tracking-widest"
        :class="[ $route.path === '/models' ? 'text-morandi-text' : 'text-morandi-muted' ]"
      >
        模特库
        <span v-if="$route.path === '/models'" class="absolute bottom-0 left-0 w-full h-[1.5px] bg-morandi-text"></span>
      </router-link>

      <router-link 
        to="/locations" 
        class="text-xs font-medium transition-colors hover:text-morandi-text relative py-2 tracking-widest"
        :class="[ $route.path === '/locations' ? 'text-morandi-text' : 'text-morandi-muted' ]"
      >
        场地库
        <span v-if="$route.path === '/locations'" class="absolute bottom-0 left-0 w-full h-[1.5px] bg-morandi-text"></span>
      </router-link>
    </nav>

    <!-- 右侧 操作区 (与左侧 flex-1 对应保持中间绝对居中) -->
    <div class="flex-1 flex items-center justify-end space-x-4">
      <router-link 
        to="/settings"
        class="px-6 py-2 bg-morandi-text text-morandi-canvas text-[11px] uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity font-medium"
      >
        全局设置
      </router-link>
    </div>

  </header>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>
