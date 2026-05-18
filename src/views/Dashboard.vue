<template>
  <div class="h-full overflow-y-auto px-12 py-10">
    <div class="flex justify-between items-end mb-12">
      <div>
        <h1 class="text-4xl font-serif text-morandi-text/90 mb-2 tracking-[0.1em]">我的策划</h1>
        <p class="text-morandi-muted text-[10px] tracking-[0.3em] uppercase">All Plans / Moodboards</p>
      </div>
      <div class="flex items-center">
        <!-- 组合式新建按钮 (Split Button) -->
        <div class="flex items-stretch shadow-sm">
          <!-- 主动作：新建空策划 -->
          <button 
            @click="createNewPlan"
            class="px-6 py-2 bg-morandi-text text-white text-sm uppercase tracking-wider hover:bg-black transition-colors border-r border-white/10"
          >
            + 新建策划
          </button>
          
          <!-- 次动作：模板下拉（仅在有模板时显示） -->
          <div v-if="store.templates.length > 0" class="relative">
            <button 
              @click="showTemplateMenu = !showTemplateMenu"
              class="h-full px-3 bg-morandi-text text-white hover:bg-black transition-colors flex items-center"
              title="从模板新建"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <!-- 模板下拉列表 -->
            <div v-if="showTemplateMenu" class="fixed inset-0 z-10" @click="showTemplateMenu = false"></div>
            <transition name="fade-pop-down">
              <div v-if="showTemplateMenu" class="absolute right-0 top-full mt-2 bg-white border border-black/5 shadow-2xl z-20 min-w-[220px] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div class="px-4 py-2 text-[10px] text-morandi-muted uppercase tracking-widest border-b border-black/5 mb-1">选择模板</div>
                <button 
                  v-for="tpl in store.templates" :key="tpl.id"
                  @click="createFromTemplate(tpl)"
                  class="w-full text-left px-4 py-3 text-sm text-morandi-text hover:bg-morandi-canvas transition-colors"
                >
                  {{ tpl.name }}
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="store.loading" class="flex justify-center items-center py-20">
      <p class="text-morandi-muted text-sm uppercase tracking-widest">Loading...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="store.plans.length === 0" class="flex flex-col items-center justify-center py-32">
      <div class="text-6xl text-morandi-muted/30 mb-8 font-serif">✦</div>
      <p class="text-morandi-muted text-sm uppercase tracking-widest mb-6">尚无策划案</p>
      <button 
        @click="createNewPlan"
        class="px-8 py-3 bg-morandi-text text-white text-sm uppercase tracking-wider hover:bg-black/80 transition-colors"
      >
        创建第一个策划案
      </button>
    </div>

    <!-- 画册式网格布局 (优化为一行六列卡片式设计) -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
      <div 
        v-for="plan in store.plans" :key="plan.id" 
        class="group cursor-pointer bg-white border border-black/5 p-3 hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
        @click="openPlan(plan)"
      >
        <div class="relative overflow-hidden aspect-square bg-morandi-canvas mb-4">
          <!-- 封面图：提取主题模块第一张图 -->
          <img v-if="getPlanCover(plan)" :src="getPlanCover(plan)" alt="Cover" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div v-else class="w-full h-full flex items-center justify-center text-morandi-muted/30">
            <span class="text-4xl font-serif">{{ plan.title?.charAt(0) || '?' }}</span>
          </div>
        </div>
        <div class="px-1 pb-1">
          <h2 class="font-serif text-sm text-morandi-text mb-1 truncate group-hover:text-morandi-blue transition-colors">{{ plan.title }}</h2>
          <p class="text-[10px] text-morandi-muted uppercase tracking-widest">{{ formatDate(plan.created_at) }}</p>
        </div>
      </div>
    </div>

    <!-- 自定义精美弹窗 (Morandi Style Modal) -->
    <transition name="fade">
      <div v-if="modal.show" class="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
          <div class="p-8">
            <h3 class="font-serif text-xl text-morandi-text mb-2">{{ modal.title }}</h3>
            <p class="text-sm text-morandi-muted mb-6 leading-relaxed">{{ modal.message }}</p>
            
            <!-- Prompt 输入框 -->
            <div v-if="modal.type === 'prompt'" class="mb-8">
              <input 
                v-model="modal.inputValue" 
                type="text" 
                class="w-full px-4 py-3 border border-black/5 bg-morandi-canvas/30 outline-none focus:border-morandi-blue text-sm"
                autofocus
                @keyup.enter="handleModalConfirm"
              />
            </div>

            <div class="flex justify-end space-x-4">
              <button 
                v-if="modal.type !== 'alert'"
                @click="closeModal" 
                class="px-6 py-2.5 text-xs uppercase tracking-widest text-morandi-muted hover:text-morandi-text transition-colors"
              >
                取消
              </button>
              <button 
                @click="handleModalConfirm" 
                class="px-8 py-2.5 bg-morandi-text text-white text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanStore } from '../store/planStore'
import { useModal } from '../composables/useModal'

const router = useRouter()
const store = usePlanStore()
const showTemplateMenu = ref(false)

// 弹窗状态管理（复用 composable）
const { modal, showModal, closeModal, handleModalConfirm } = useModal()

// 页面加载时拉取策划案列表和模板列表
onMounted(async () => {
  await Promise.all([
    store.fetchPlans(),
    store.fetchTemplates(),
  ])
})

/** 新建空策划案并跳转到编辑器 (自动进入编辑模式) */
const createNewPlan = () => {
  showModal({
    title: '新建策划',
    message: '请为您的新策划案命名：',
    type: 'prompt',
    inputValue: '未命名策划案',
    onConfirm: async (name) => {
      if (name) {
        const record = await store.createPlan(name)
        if (record) {
          await store.loadPlan(record.id)
          router.push({ path: '/editor', query: { mode: 'edit' } })
        }
      }
    }
  })
}

/** 从模板新建策划案 (自动进入编辑模式) */
const createFromTemplate = (template) => {
  showTemplateMenu.value = false
  showModal({
    title: '从模板新建',
    message: `使用模板 "${template.name}" 创建，请为新策划案命名：`,
    type: 'prompt',
    inputValue: `${template.name}的副本`,
    onConfirm: async (name) => {
      if (name) {
        const record = await store.createPlanFromTemplate(name, template.id)
        if (record) {
          await store.loadPlan(record.id)
          router.push({ path: '/editor', query: { mode: 'edit' } })
        }
      }
    }
  })
}

/** 打开已有策划案 */
const openPlan = async (plan) => {
  await store.loadPlan(plan.id)
  router.push('/editor')
}

/** 格式化日期显示 */
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.substring(0, 10).replace(/-/g, '.')
}

/** 智能提取封面：优先从 modules_json 中寻找主题模块的第一张图 */
const getPlanCover = (plan) => {
  if (!plan.modules_json) return null
  try {
    const modules = typeof plan.modules_json === 'string' 
      ? JSON.parse(plan.modules_json) 
      : plan.modules_json
    const themeModule = modules.find(m => m.type === 'theme')
    if (themeModule && themeModule.data?.images?.length > 0) {
      const firstImg = themeModule.data.images[0]
      return firstImg.url || firstImg
    }
  } catch (e) {
    console.warn('解析封面失败:', e)
  }
  return null
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.fade-pop-down-enter-active, .fade-pop-down-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-pop-down-enter-from, .fade-pop-down-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
