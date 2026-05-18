<template>
  <header class="h-16 bg-morandi-canvas flex items-center px-8 sticky top-0 z-50 transition-all">
    
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
        class="text-sm font-medium transition-colors hover:text-morandi-text relative py-2"
        :class="[ $route.path === '/' ? 'text-morandi-text' : 'text-morandi-muted' ]"
      >
        策划
        <span v-if="$route.path === '/'" class="absolute bottom-0 left-0 w-full h-[2px] bg-morandi-blue rounded-full"></span>
      </router-link>



      <router-link 
        to="/models" 
        class="text-sm font-medium transition-colors hover:text-morandi-text relative py-2"
        :class="[ $route.path === '/models' ? 'text-morandi-text' : 'text-morandi-muted' ]"
      >
        模特库
        <span v-if="$route.path === '/models'" class="absolute bottom-0 left-0 w-full h-[2px] bg-morandi-blue rounded-full"></span>
      </router-link>

      <router-link 
        to="/locations" 
        class="text-sm font-medium transition-colors hover:text-morandi-text relative py-2"
        :class="[ $route.path === '/locations' ? 'text-morandi-text' : 'text-morandi-muted' ]"
      >
        场地库
        <span v-if="$route.path === '/locations'" class="absolute bottom-0 left-0 w-full h-[2px] bg-morandi-blue rounded-full"></span>
      </router-link>
    </nav>

    <!-- 右侧 操作区 (与左侧 flex-1 对应保持中间绝对居中) -->
    <div class="flex-1 flex items-center justify-end space-x-4">
      <router-link 
        to="/settings"
        class="px-4 py-2 text-xs uppercase tracking-wider text-morandi-text border border-morandi-text hover:bg-black/5 transition-colors"
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
