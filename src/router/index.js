import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import PlanEditor from '../views/PlanEditor.vue'
import Models from '../views/Models.vue'
import Locations from '../views/Locations.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/editor', name: 'PlanEditor', component: PlanEditor },
  { path: '/models', name: 'Models', component: Models },
  { path: '/locations', name: 'Locations', component: Locations },
  { path: '/settings', name: 'Settings', component: () => import('../views/Settings.vue') },
]

const router = createRouter({
  // 使用 WebHashHistory 避免 Electron 打包后的本地文件路径问题
  history: createWebHashHistory(),
  routes,
})

export default router
