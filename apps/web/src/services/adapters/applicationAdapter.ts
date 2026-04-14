import type { Application, Material } from '../../types'

const BIZ_TYPE_LABEL_MAP: Record<string, string> = {
  property: '房产公证',
  will: '遗嘱公证',
  marriage: '婚姻公证',
  '委托': '委托公证',
  ENFORCEMENT: '强制执行',
  DEPOSIT: '存款继承',
  other: '其他',
}

export function getBizTypeLabel(value: string): string {
  return BIZ_TYPE_LABEL_MAP[value] ?? value
}

export function normalizeStatus(raw: string): Application['status'] {
  const map: Record<string, Application['status']> = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    SUBMIT: 'submitted',
    SUPPLEMENT_REQUIRED: 'supplement_required',
    SUPPLEMENT: 'supplement_required',
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn',
    VOIDED: 'voided',
  }
  return map[raw.toUpperCase()] ?? (raw as Application['status'])
}

export interface RawApplication {
  id?: string
  _id?: string
  biz_type?: string
  bizType?: string
  title?: string
  description?: string
  status?: string
  user_id?: string
  userId?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  materials?: RawMaterial[]
  supplement_reason?: string
  supplementReason?: string
  [key: string]: unknown
}

export interface RawMaterial {
  id?: string
  _id?: string
  name?: string
  url?: string
  type?: string
  material_type?: string
  uploaded_at?: string
  uploadedAt?: string
  [key: string]: unknown
}

export function normalizeMaterial(raw: RawMaterial): Material {
  return {
    id: raw.id ?? raw._id ?? '',
    name: raw.name ?? '',
    url: raw.url ?? '',
    type: raw.material_type ?? raw.type ?? '',
    uploadedAt: raw.uploaded_at ?? raw.uploadedAt ?? '',
  }
}

export function normalizeApplication(raw: RawApplication): Application {
  return {
    id: raw.id ?? raw._id ?? '',
    userId: raw.user_id ?? raw.userId ?? '',
    status: normalizeStatus(raw.status ?? 'draft'),
    bizType: raw.biz_type ?? raw.bizType ?? '',
    title: raw.title ?? '',
    description: raw.description ?? '',
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
    materials: (raw.materials ?? []).map(normalizeMaterial),
    supplementReason: raw.supplement_reason ?? raw.supplementReason,
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface RawPaginatedResponse {
  items?: unknown[]
  data?: unknown[]
  page?: number | string
  page_size?: number | string
  pageSize?: number | string
  total?: number | string
  [key: string]: unknown
}

export function normalizePaginated<T, R>(
  raw: RawPaginatedResponse,
  normalizer: (item: unknown) => R
): PaginatedResponse<R> {
  const items = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.data) ? raw.data : []
  const page = typeof raw.page === 'string' ? parseInt(raw.page) : (raw.page ?? 1)
  const pageSize = typeof raw.page_size === 'string'
    ? parseInt(raw.page_size)
    : typeof raw.pageSize === 'string'
    ? parseInt(raw.pageSize)
    : raw.pageSize ?? 10
  const total = typeof raw.total === 'string' ? parseInt(raw.total) : (raw.total ?? items.length)

  return {
    data: items.map(normalizer),
    total,
    page,
    pageSize,
  }
}
