import axios, { AxiosInstance, AxiosError } from 'axios'
import { message } from 'antd'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userType')
      window.location.href = '/login'
    } else {
      const errMsg = (error.response?.data as any)?.message || error.message || '请求失败'
      message.error(errMsg)
    }
    return Promise.reject(error)
  }
)

export default client
