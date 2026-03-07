import { reactive } from 'vue'

export function useToast() {
  const toast = reactive({
    show: false,
    type: '',
    title: '',
    message: ''
  })

  function showToast(type, title, msg) {
    try {
      toast.type = type || 'info'
      // Support two-arg showToast('info', 'message') and three-arg showToast(type, title, msg)
      if (msg === undefined && typeof title === 'string') {
        toast.title = ''
        toast.message = title
      } else {
        toast.title = title || ''
        toast.message = msg || ''
      }
      toast.show = true
      setTimeout(() => { toast.show = false }, 4000)
    } catch (e) {
      console.warn('showToast error', e)
    }
  }

  return { toast, showToast }
}
