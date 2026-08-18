import { defineStore } from 'pinia'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as ToastItem[],
  }),
  actions: {
    show(message: string, type: ToastItem['type'] = 'info', duration = 3000) {
      const id = Date.now()
      this.toasts.push({ id, message, type })
      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id)
      }, duration)
    },
  },
})
