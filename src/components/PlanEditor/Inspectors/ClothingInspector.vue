<template>
  <div>
    <!-- 顶部主动作与导入按钮 -->
    <div class="flex gap-2 mb-6">
      <button 
        @click="addEmptyItem"
        class="flex-1 py-3 bg-morandi-text text-morandi-canvas text-[10px] uppercase tracking-widest rounded-full hover:opacity-90 transition-all outline-none font-medium shadow-sm"
      >
        + 添加搭配
      </button>
      <button 
        @click="$emit('toggle-library')"
        class="flex-1 py-3 border border-morandi-text text-morandi-text text-[10px] uppercase tracking-widest rounded-full hover:bg-morandi-text hover:text-morandi-canvas transition-all outline-none font-medium"
      >
        从素材库导入
      </button>
    </div>

    <!-- 服装搭配列表 -->
    <div class="space-y-4">
      <div 
        v-for="(item, idx) in formData.items" 
        :key="item.id || idx"
        class="bg-morandi-canvas/5 p-4 rounded-[2px]"
      >
        <!-- 卡片头部 (Header) -->
        <div class="flex items-center justify-between pb-3 border-b border-morandi-border/20 cursor-pointer select-none" @click="toggleCollapse(item.id)">
          <div class="flex items-center space-x-2 min-w-0 pr-2">
            <span class="text-luxury-meta-sm text-morandi-muted font-bold">#{{ idx + 1 }}</span>
            <span class="text-xs font-serif font-bold text-morandi-text truncate">{{ item.name || '未命名服装搭配' }}</span>
          </div>

          <div class="flex items-center space-x-2 flex-shrink-0" @click.stop>
            <!-- 存入素材库 -->
            <button 
              @click="saveItem(item)"
              class="px-2 py-0.5 border border-morandi-text/40 text-morandi-text hover:bg-morandi-text hover:text-morandi-canvas text-[8px] uppercase tracking-widest rounded-full transition-all outline-none font-medium"
              title="同步当前服装到素材库"
            >
              存库
            </button>
            
            <!-- 删除子项 -->
            <button 
              @click="removeItem(idx)"
              class="p-1 text-morandi-muted hover:text-morandi-red transition-colors"
              title="删除此服装搭配"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            <!-- 折叠展开箭头 -->
            <span class="text-morandi-muted text-[8px] transition-transform duration-300" :class="{ 'rotate-180': activeCollapsedId === item.id }">
              ▼
            </span>
          </div>
        </div>

        <!-- 卡片折叠展开内容 (Body) -->
        <transition name="fade-height">
          <div v-show="activeCollapsedId === item.id" class="pt-4 space-y-4">
            <div>
              <label class="block text-[9px] uppercase tracking-wider text-morandi-muted mb-1 font-bold">服装名称 / NAME</label>
              <input v-model="item.name" type="text" class="w-full px-1 py-2 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-xs text-morandi-text rounded-none" placeholder="如: JK制服" />
            </div>

            <div>
              <label class="block text-[9px] uppercase tracking-wider text-morandi-muted mb-1 font-bold">搭配描述 / DESCRIPTION</label>
              <textarea v-model="item.description" rows="2" class="w-full px-1 py-2 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-xs text-morandi-text rounded-none resize-none font-sans" placeholder="如: 尺码版型、穿搭要点..."></textarea>
            </div>

            <div>
              <label class="block text-[9px] uppercase tracking-wider text-morandi-muted mb-1 font-bold">分类标签 / TAGS</label>
              <input v-model="item.tagsInput" type="text" placeholder="用逗号分隔，如：复古, 活力" class="w-full px-1 py-2 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-xs text-morandi-text rounded-none" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[9px] uppercase tracking-wider text-morandi-muted mb-1 font-bold">价格/租金 / PRICE</label>
                <input v-model="item.price" type="text" class="w-full px-1 py-2 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-xs text-morandi-text rounded-none" placeholder="￥200/天" />
              </div>
              <div>
                <label class="block text-[9px] uppercase tracking-wider text-morandi-muted mb-1 font-bold">购买链接 / LINK</label>
                <input v-model="item.link" type="text" class="w-full px-1 py-2 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-xs text-morandi-text rounded-none" placeholder="淘宝或来源网址" />
              </div>
            </div>

            <div>
              <label class="block text-[9px] uppercase tracking-wider text-morandi-muted mb-1 font-bold font-serif">服装照片 / PHOTOS</label>
              <ImageUploader 
                v-model="item.images" 
                :category="category + '/' + item.id" 
                :multi="true" 
                @mouseenter="onUploaderMouseEnter(item.id)"
                @mouseleave="onUploaderMouseLeave"
                :ref="el => { if (el) uploadRefs[item.id] = el }"
              />
            </div>
          </div>
        </transition>
      </div>

      <!-- 空状态提示 -->
      <div 
        v-if="!formData.items || formData.items.length === 0" 
        class="py-12 border border-dashed border-morandi-border/30 text-center rounded-[2px] bg-morandi-canvas/5"
      >
        <span class="text-[9px] font-sans text-morandi-muted uppercase tracking-widest block mb-1">No Outfit Matching</span>
        <span class="text-[11px] font-serif italic text-morandi-muted/80">* 暂无服装搭配，请点击上方按钮添加搭配或从素材库导入</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import ImageUploader from '../../common/ImageUploader.vue'
import { usePasteTarget } from '../../../composables/usePasteTarget'

const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  category: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['toggle-library', 'save-library'])

const activeCollapsedId = ref('')
const uploadRefs = ref({})
const currentPasteItemId = ref('')

const { activate, deactivate } = usePasteTarget()

// 展开/收起控制
const toggleCollapse = (id) => {
  activeCollapsedId.value = activeCollapsedId.value === id ? '' : id
}

// 自动展开第一项
watch(() => props.formData.items, (newVal) => {
  if (newVal && newVal.length > 0 && !activeCollapsedId.value) {
    activeCollapsedId.value = newVal[0].id
  }
}, { immediate: true })

const addEmptyItem = () => {
  if (!props.formData.items) {
    props.formData.items = []
  }
  const id = 'item-' + Date.now()
  props.formData.items.push({
    id,
    name: '',
    description: '',
    tags: [],
    tagsInput: '',
    price: '',
    link: '',
    images: []
  })
  activeCollapsedId.value = id
}

const removeItem = (idx) => {
  props.formData.items.splice(idx, 1)
}

const saveItem = (item) => {
  emit('save-library', item)
}

// 粘贴逻辑
const handlePaste = async (e) => {
  const itemId = currentPasteItemId.value
  const uploader = uploadRefs.value[itemId]
  if (uploader && uploader.handlePaste) {
    if (uploader.isUploading) return
    const newImages = await uploader.handlePaste(e, `${props.category}/${itemId}`)
    if (newImages && newImages.length > 0) {
      uploader.emitChanges(newImages)
    }
  }
}

const onUploaderMouseEnter = (itemId) => {
  currentPasteItemId.value = itemId
  activate(handlePaste)
}

const onUploaderMouseLeave = () => {
  deactivate()
}
</script>

<style scoped>
.fade-height-enter-active,
.fade-height-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 500px;
  opacity: 1;
}
.fade-height-enter-from,
.fade-height-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
</style>
