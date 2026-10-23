import { defineStore } from 'pinia'
import api from '@/services/api'

interface User {
  id: number
  fullname: string
  username: string
  email: string
  nisn: string | null
  masa_studi: number | null
  must_change_password: boolean
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
  must_change_password?: boolean
  message: string
}

let fetchUserPromise: Promise<void> | null = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('token'),
    permissions: [] as string[],
    loading: false,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,

    hasPermission: (state) => {
      return (permission: string) => state.permissions.includes(permission)
    },

    hasAnyPermission: (state) => {
      return (permissions: string[]) =>
        permissions.some((permission) => state.permissions.includes(permission))
    },

    hasAllPermissions: (state) => {
      return (permissions: string[]) =>
        permissions.every((permission) => state.permissions.includes(permission))
    },
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
        this.initialized = true

        localStorage.setItem('token', data.token)

        return {
          success: true,
          message: data.message,
          must_change_password: data.must_change_password ?? data.user?.must_change_password ?? false,
        }
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'message.loginFailed',
          must_change_password: false,
        }
      } finally {
        this.loading = false
      }
    },

    async fetchUser() {
      if (this.initialized) return

      // Jika request /me sedang berjalan, tunggu request yang sama.
      if (fetchUserPromise) {
        await fetchUserPromise
        return
      }

      if (!this.token) {
        this.initialized = true
        return
      }

      fetchUserPromise = (async () => {
        try {
          const response = await api.get<{
            success: boolean
            user: User
            permissions: string[]
          }>('/me')

          if (response.data.success) {
            this.user = response.data.user
            this.permissions = response.data.permissions
          } else {
            await this.logout()
          }
        } catch (error: any) {
          if (error.response?.status === 401) {
            await this.logout()
          } else {
            console.error('Gagal mengambil data user:', error)
          }
        } finally {
          this.initialized = true
        }
      })()

      try {
        await fetchUserPromise
      } finally {
        fetchUserPromise = null
      }
    },

    setUserFromMe(user: User, permissions: string[]) {
      this.user = user
      this.permissions = permissions
    },

    clearMustChangePassword() {
      if (this.user) {
        this.user.must_change_password = false
      }
    },

    async logout() {
      await new Promise((resolve) => setTimeout(resolve, 500))

      this.user = null
      this.token = null
      this.permissions = []
      this.initialized = true
      localStorage.removeItem('token')
    },
  },
})
