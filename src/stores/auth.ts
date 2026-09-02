import { defineStore } from 'pinia'
import api from '@/services/api'

interface User {
  id: number
  fullname: string
  username: string
  email: string
  nisn: string | null
  role_id: number
  reset_token: string | null
  reset_token_expired_at: string | null
  email_verified_at: string | null
  last_login_at: string | null
  status_code: string
  created_by: number | null
  updated_by: number | null
  created_at: string | null
  updated_at: string | null
  role_code: string
  role_name: string
}

interface LoginResponse {
  success: boolean
  user: User
  token: string
  permissions: string[]
  message: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('token'),
    permissions: [] as string[],
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(username: string, password: string) {
      this.loading = true

      try {
        const response = await api.post<LoginResponse>('/login', {
          username,
          password,
        })

        const data = response.data

        if (!data.success) {
          return {
            success: false,
            message: data.message,
          }
        }

        this.user = data.user
        this.token = data.token
        this.permissions = data.permissions

        localStorage.setItem('token', data.token)

        return {
          success: true,
          message: data.message,
        }
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'message.loginFailed',
        }
      } finally {
        this.loading = false
      }
    },
    async fetchUser() {
      if (!this.token) return

      try {
        const response = await api.get<{ success: boolean; user: User; permissions: string[] }>(
          '/me',
        )
        if (response.data.success) {
          this.user = response.data.user
          this.permissions = response.data.permissions
        }
      } catch (error) {
        // token invalid/expired -> logout paksa
        this.logout()
      }
    },

    async logout() {
      await new Promise((resolve) => setTimeout(resolve, 500))

      this.user = null
      this.token = null
      this.permissions = []
      localStorage.removeItem('token')
    },
  },
})
