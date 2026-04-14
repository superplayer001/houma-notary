export interface LoginRequest {
  phone?: string
  username?: string
  password: string
}

export interface LoginResponse {
  token: string
  userType: 'user' | 'staff'
  userId: string
  username: string
}

export type ApplicationStatus = 'draft' | 'pending' | 'processing' | 'completed' | 'rejected' | 'voided'

export interface Application {
  id: string
  userId: string
  status: ApplicationStatus
  bizType: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  materials?: Material[]
}

export interface Material {
  id: string
  name: string
  url: string
  type: string
  uploadedAt: string
}

export type CaseStatus = 'assigned' | 'in_progress' | 'completed' | 'voided'

export interface Case {
  id: string
  caseNo?: string
  applicationId: string
  staffId?: string
  status: CaseStatus
  bizType?: string
  result?: string
  certificateNo?: string
  verifyCode?: string
  acceptedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export const BIZ_TYPE_OPTIONS = [
  { label: '房产公证', value: 'property' },
  { label: '遗嘱公证', value: 'will' },
  { label: '婚姻公证', value: 'marriage' },
  { label: '委托公证', value: '委托' },
  { label: '其他', value: 'other' },
]

export const APPLICATION_STATUS_MAP: Record<ApplicationStatus, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  pending: { color: 'orange', text: '待处理' },
  processing: { color: 'blue', text: '处理中' },
  completed: { color: 'green', text: '已完成' },
  rejected: { color: 'red', text: '已驳回' },
  voided: { color: 'default', text: '已作废' },
}

export const CASE_STATUS_MAP: Record<CaseStatus, { color: string; text: string }> = {
  assigned: { color: 'blue', text: '已分配' },
  in_progress: { color: 'orange', text: '进行中' },
  completed: { color: 'green', text: '已完成' },
  voided: { color: 'default', text: '已作废' },
}
