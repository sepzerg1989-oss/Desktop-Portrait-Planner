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
    placeholder: '',
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

  const handleModalConfirm = async (val) => {
    let finalVal = modal.value.inputValue
    if (typeof val === 'string') {
      finalVal = val
    }
    if (modal.value.onConfirm) {
      await modal.value.onConfirm(finalVal)
    }
    closeModal()
  }

  return { modal, showModal, closeModal, handleModalConfirm }
}
