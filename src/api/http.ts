import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

export interface ApiErrorBody {
  message?: string
  code?: string
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  response => response,
  (error: AxiosError<ApiErrorBody>) => {
    const message =
      error.response?.data?.message ?? error.message ?? '请求失败'
    return Promise.reject(new Error(message))
  },
)

export default http
