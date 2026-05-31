<template>
  <div ref="selectRef" class="relative inline-block w-full font-sans select-none">
    <!-- 触发器 (下划线 Ghost 风格) -->
    <div 
      @click="toggleDropdown"
      class="w-full flex items-center justify-between px-1 py-2 border-b border-morandi-border bg-transparent outline-none cursor-pointer transition-colors"
      :class="[
        isOpen ? 'border-morandi-text text-morandi-text' : 'border-morandi-border text-morandi-text hover:border-morandi-text',
        customClass
      ]"
    >
      <span class="text-xs truncate mr-2">{{ selectedLabel }}</span>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        class="h-3 w-3 text-morandi-muted transition-transform duration-300"
        :class="{ 'rotate-180': isOpen }" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <!-- 下拉弹出层 (直角卡纸与悬浮微光) -->
    <transition name="fade-pop-down">
      <div 
        v-if="isOpen" 
        class="absolute left-0 mt-1 w-full min-w-[150px] bg-morandi-paper border border-morandi-border shadow-2xl z-50 rounded-none max-h-[250px] overflow-y-auto scroll-thin"
        :class="align === 'right' ? 'right-0 left-auto' : 'left-0'"
      >
        <div class="py-1">
          <button
            v-for="opt in formattedOptions"
            :key="opt.value"
            @click="selectOption(opt.value)"
            class="w-full text-left px-4 py-2 text-xs transition-colors outline-none rounded-none"
            :class="[
              modelValue === opt.value
                ? 'bg-morandi-text/5 text-morandi-text font-bold'
                : 'text-morandi-muted hover:text-morandi-text hover:bg-morandi-text/5 bg-transparent'
            ]"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  options: {
    type: Array,
    required: true
  },
  placeholder: {
    type: String,
    default: '请选择...'
  },
  customClass: {
    type: String,
    default: ''
  },
  align: {
    type: String,
    default: 'left' // 'left' | 'right'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const selectRef = ref(null)
const isOpen = ref(false)

// 统一将 options 转化为 { value, label } 架构以保持最高兼容度
const formattedOptions = computed(() => {
  return props.options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.id,
        label: opt.label !== undefined ? opt.label : opt.name
      }
    }
    return { value: opt, label: opt }
  })
})

const selectedLabel = computed(() => {
  const active = formattedOptions.value.find(opt => opt.value === props.modelValue)
  return active ? active.label : props.placeholder
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectOption = (val) => {
  emit('update:modelValue', val)
  emit('change', val)
  isOpen.value = false
}

// 外部点击收起
const handleClickOutside = (e) => {
  if (selectRef.value && !selectRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* 精致下推淡入淡出 */
.fade-pop-down-enter-active,
.fade-pop-down-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-pop-down-enter-from,
.fade-pop-down-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}
</style>
