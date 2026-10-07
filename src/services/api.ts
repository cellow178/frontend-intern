import axios from 'axios'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://cello.berinovasi.top/api'
const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '')

const api = axios.create({
  baseURL: cleanBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
