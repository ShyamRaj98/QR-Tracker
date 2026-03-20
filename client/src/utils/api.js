import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
})

// Request interceptor
api.interceptors.request.use(cfg => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

// Response interceptor
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config

    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url.includes('/auth/refresh')
    ) {
      original._retry = true

      try {
        const { refreshToken, setTokens, logout } = useAuthStore.getState()

        if (!refreshToken) {
          logout()
          return Promise.reject(err)
        }

        const { data } = await api.post('/auth/refresh', { refreshToken })

        setTokens(data.accessToken, data.refreshToken)

        original.headers.Authorization = `Bearer ${data.accessToken}`

        return api(original)

      } catch (refreshError) {
        logout()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(err)
  }
)

export default api