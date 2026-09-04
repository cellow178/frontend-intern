import { defineStore } from 'pinia'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
  duration: number
}

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as ToastItem[],
  }),
  actions: {
    show(message: string, type: ToastItem['type'] = 'info', duration = 5000) {
      const id = Date.now()
      this.toasts.push({ id, message, type, duration })
      setTimeout(() => {
        this.close(id)
      }, duration)
    },

    close(id: number) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
  },
})
