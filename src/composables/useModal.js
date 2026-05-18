import { ref } from 'vue'

/**
 * 通用弹窗组合式函数
 * 消除 Dashboard.vue / PlanEditor.vue 中的重复弹窗逻辑
 */
export function useModal() {
  const modal = ref({
    show: false,
    title: '',
    message: '',
    inputValue: '',
    type: 'alert', // 'alert' | 'prompt' | 'confirm'
    onConfirm: null
  })

  const showModal = (options) => {
    modal.value = {
      ...modal.value,
      ...options,
      show: true
    }
  }

  const closeModal = () => {
    modal.value.show = false
  }

  const handleModalConfirm = async () => {
    if (modal.value.onConfirm) {
      await modal.value.onConfirm(modal.value.inputValue)
    }
    closeModal()
  }

  return { modal, showModal, closeModal, handleModalConfirm }
}
