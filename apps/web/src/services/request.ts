import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'
import { message } from 'antd'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const MOCK_DELAY = 300

const MOCK_STAFF_PENDING = [
  { id: 'APP-001', applicationNo: 'A001', userId: 'U001', status: 'SUBMITTED', bizType: 'property', title: '房产继承公证', description: '父亲去世，需要办理房产继承公证', submittedAt: '2024-01-15 11:00:00', createdAt: '2024-01-15 10:30:00', updatedAt: '2024-01-15 10:30:00', materials: [], timeline: [] },
  { id: 'APP-003', applicationNo: 'A003', userId: 'U001', status: 'SUBMITTED', bizType: 'ENFORCEMENT', title: '强制执行公证', description: '借款合同赋予强制执行效力', submittedAt: '2024-01-14 15:00:00', createdAt: '2024-01-14 14:20:00', updatedAt: '2024-01-14 14:20:00', materials: [], timeline: [] },
  { id: 'APP-005', applicationNo: 'A005', userId: 'U002', status: 'SUBMITTED', bizType: 'will', title: '遗嘱公证', description: '本人自愿订立遗嘱公证', submittedAt: '2024-01-16 09:00:00', createdAt: '2024-01-16 08:00:00', updatedAt: '2024-01-16 08:00:00', materials: [], timeline: [] },
]

const MOCK_STAFF_APP_DETAIL: Record<string, { id: string; applicationNo: string; userId: string; status: string; bizType: string; title: string; description: string; submittedAt: string; createdAt: string; updatedAt: string; materials: unknown[]; timeline: unknown[]; supplementReason?: string; reviewComment?: string }> = {
  'APP-001': { id: 'APP-001', applicationNo: 'A001', userId: 'U001', status: 'SUBMITTED', bizType: 'property', title: '房产继承公证', description: '父亲去世，需要办理房产继承公证', submittedAt: '2024-01-15 11:00:00', createdAt: '2024-01-15 10:30:00', updatedAt: '2024-01-15 10:30:00', materials: [{ id: 'M001', name: '身份证.pdf', url: '#', type: 'id_card', uploadedAt: '2024-01-15 10:35:00' }], timeline: [{ id: 'T1', event: '用户提交申请', operator: 'U001', createdAt: '2024-01-15 11:00:00' }] },
  'APP-003': { id: 'APP-003', applicationNo: 'A003', userId: 'U001', status: 'SUBMITTED', bizType: 'ENFORCEMENT', title: '强制执行公证', description: '借款合同赋予强制执行效力', submittedAt: '2024-01-14 15:00:00', createdAt: '2024-01-14 14:20:00', updatedAt: '2024-01-14 14:20:00', materials: [], timeline: [{ id: 'T2', event: '用户提交申请', operator: 'U001', createdAt: '2024-01-14 15:00:00' }] },
}

const MOCK_STAFF_CASES = [
  { id: 'CASE-001', applicationId: 'APP-002', staffId: 'S001', status: 'completed', bizType: 'will', result: '遗嘱公证办理完成', certificateNo: 'GZ-2024-001', verifyCode: 'VERIFY001', certificateStatus: 'issued', issuedAt: '2024-01-12 16:00:00', acceptedAt: '2024-01-11 09:00:00', completedAt: '2024-01-12 16:00:00', createdAt: '2024-01-10 09:00:00', updatedAt: '2024-01-12 16:00:00' },
  { id: 'CASE-002', applicationId: 'APP-001', staffId: 'S001', status: 'in_progress', bizType: 'property', createdAt: '2024-01-15 10:30:00', updatedAt: '2024-01-16 08:00:00' },
]

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  if (USE_MOCK) {
    const url = config.url ?? ''

    if (url === '/staff/applications/pending') {
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: { items: MOCK_STAFF_PENDING, page: 1, page_size: 10, total: MOCK_STAFF_PENDING.length }, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/applications\/[^/]+$/) && config.method === 'get') {
      const segments = url.split('/')
      const id = segments[3]
      const app = MOCK_STAFF_APP_DETAIL[id] ?? MOCK_STAFF_APP_DETAIL['APP-001']
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: app, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/applications\/[^/]+\/require-supplement$/)) {
      const segments = url.split('/')
      const id = segments[3]
      const app = MOCK_STAFF_APP_DETAIL[id] ?? MOCK_STAFF_APP_DETAIL['APP-001']
      const updated = { ...app, status: 'SUPPLEMENT_REQUIRED', supplementReason: '请补充身份证正反面' }
      MOCK_STAFF_APP_DETAIL[id] = updated
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: updated, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/applications\/[^/]+\/reject$/)) {
      const segments = url.split('/')
      const id = segments[3]
      const app = MOCK_STAFF_APP_DETAIL[id] ?? MOCK_STAFF_APP_DETAIL['APP-001']
      const updated = { ...app, status: 'REJECTED' }
      MOCK_STAFF_APP_DETAIL[id] = updated
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: updated, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/applications\/[^/]+\/accept$/)) {
      const segments = url.split('/')
      const id = segments[3]
      const app = MOCK_STAFF_APP_DETAIL[id] ?? MOCK_STAFF_APP_DETAIL['APP-001']
      const updated = { ...app, status: 'ACCEPTED', reviewComment: '准予受理' }
      MOCK_STAFF_APP_DETAIL[id] = updated
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: updated, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.startsWith('/staff/cases')) {
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: { items: MOCK_STAFF_CASES, total: MOCK_STAFF_CASES.length, page: 1, pageSize: 10 }, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/cases\/[^/]+$/)) {
      const id = url.split('/')[3]
      const c = MOCK_STAFF_CASES.find(x => x.id === id) ?? MOCK_STAFF_CASES[0]
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: c, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/cases\/[^/]+\/complete$/)) {
      const id = url.split('/')[3]
      const c = { ...(MOCK_STAFF_CASES.find(x => x.id === id) ?? MOCK_STAFF_CASES[0]), status: 'completed', result: '' }
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: c, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/cases\/[^/]+\/void$/)) {
      const id = url.split('/')[3]
      const c = { ...(MOCK_STAFF_CASES.find(x => x.id === id) ?? MOCK_STAFF_CASES[0]), status: 'voided' }
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: c, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/applications\/[^/]+\/assign$/)) {
      const id = url.split('/')[3]
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: { id, staffId: 'S001', status: 'assigned', caseId: `CASE-${id.replace('APP', '')}` }, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/applications\/[^/]+\/supplement$/)) {
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: null, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }
  }
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userType')
        localStorage.removeItem('userId')
        localStorage.removeItem('username')
        window.location.href = '/login'
        message.error('登录已过期，请重新登录')
      } else if (status === 403) {
        message.error('没有权限访问此资源')
      } else if (status === 404) {
        message.error('请求的资源不存在')
      } else if (status >= 500) {
        message.error('服务器错误，请稍后重试')
      } else {
        const errMsg = (error.response.data as { message?: string })?.message ?? error.message ?? '请求失败'
        message.error(errMsg)
      }
    } else if (error.request) {
      message.error('网络连接失败，请检查网络')
    } else {
      message.error('请求失败，请稍后重试')
    }
    return Promise.reject(error)
  }
)

export { client, USE_MOCK }

export function isMockMode(): boolean {
  return USE_MOCK
}
