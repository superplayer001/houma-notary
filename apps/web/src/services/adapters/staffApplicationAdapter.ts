import type { Material } from '../../types'
import { normalizeStatus } from './applicationAdapter'

export interface RawPendingApplication {
  id?: string
  _id?: string
  application_no?: string
  applicationNo?: string
  biz_type?: string
  bizType?: string
  title?: string
  status?: string
  submitted_at?: string
  submittedAt?: string
  created_at?: string
  createdAt?: string
  [key: string]: unknown
}

export interface RawTimelineEvent {
  id?: string
  _id?: string
  scope?: string
  action_type?: string
  from_status?: string
  to_status?: string
  comment?: string
  operator_type?: string
  created_at?: string
  createdAt?: string
  [key: string]: unknown
}

export interface RawMaterial {
  id?: string
  _id?: string
  material_type?: string
  file_name?: string
  file_size?: number
  file_hash?: string
  created_at?: string
  [key: string]: unknown
}

export interface RawStaffApplication {
  id?: string
  _id?: string
  application_no?: string
  applicationNo?: string
  biz_type?: string
  bizType?: string
  title?: string
  status?: string
  submitted_at?: string
  submittedAt?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  supplement_reason?: string
  supplementReason?: string
  review_comment?: string
  reviewComment?: string
  materials?: RawMaterial[]
  review_actions?: RawTimelineEvent[]
  timeline?: RawTimelineEvent[]
  application?: RawStaffApplication
  [key: string]: unknown
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

export interface TimelineEvent {
  id: string
  event: string
  operator?: string
  comment?: string
  createdAt: string
}

export interface PendingApplication {
  id: string
  applicationNo: string
  bizType: string
  title: string
  status: string
  submittedAt: string
  createdAt: string
}

export interface StaffApplicationDetail {
  id: string
  applicationNo: string
  userId: string
  status: string
  bizType: string
  title: string
  description: string
  submittedAt: string
  createdAt: string
  updatedAt: string
  materials: Material[]
  supplementReason?: string
  reviewComment?: string
  timeline: TimelineEvent[]
}

function normalizeMaterial(raw: RawMaterial): Material {
  return {
    id: raw.id ?? raw._id ?? '',
    name: raw.file_name ?? '',
    url: '',
    type: raw.material_type ?? '',
    uploadedAt: raw.created_at ?? '',
  }
}

function normalizeTimelineEvent(raw: RawTimelineEvent): TimelineEvent {
  return {
    id: raw.id ?? raw._id ?? '',
    event: (raw.action_type ?? raw.event ?? '') as string,
    operator: (raw.operator_type ?? raw.operator) as string | undefined,
    comment: raw.comment,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
  }
}

export function normalizeStaffApplication(raw: unknown): PendingApplication | StaffApplicationDetail {
  const r = raw as RawStaffApplication

  if (r.application) {
    const app = r.application
    const timeline = (app.review_actions ?? app.timeline ?? []).map(normalizeTimelineEvent)
    return {
      id: (app.id ?? app._id ?? '') as string,
      applicationNo: (app.application_no ?? app.applicationNo ?? '') as string,
      userId: (app.user_id ?? app.userId ?? '') as string,
      status: normalizeStatus((app.status ?? 'draft') as string),
      bizType: (app.biz_type ?? app.bizType ?? '') as string,
      title: (app.title ?? '') as string,
      description: (app.description ?? '') as string,
      submittedAt: (app.submitted_at ?? app.submittedAt ?? '') as string,
      createdAt: (app.created_at ?? app.createdAt ?? '') as string,
      updatedAt: (app.updated_at ?? app.updatedAt ?? '') as string,
      materials: (app.materials ?? []).map(normalizeMaterial),
      supplementReason: app.supplement_reason ?? app.supplementReason,
      reviewComment: app.review_comment ?? app.reviewComment,
      timeline,
    }
  }

  const timeline = (r.review_actions ?? r.timeline ?? []).map(normalizeTimelineEvent)
  return {
    id: (r.id ?? r._id ?? '') as string,
    applicationNo: (r.application_no ?? r.applicationNo ?? '') as string,
    userId: (r.user_id ?? r.userId ?? '') as string,
    status: normalizeStatus((r.status ?? 'draft') as string),
    bizType: (r.biz_type ?? r.bizType ?? '') as string,
    title: (r.title ?? '') as string,
    description: (r.description ?? '') as string,
    submittedAt: (r.submitted_at ?? r.submittedAt ?? '') as string,
    createdAt: (r.created_at ?? r.createdAt ?? '') as string,
    updatedAt: (r.updated_at ?? r.updatedAt ?? '') as string,
    materials: (r.materials ?? []).map(normalizeMaterial),
    supplementReason: r.supplement_reason ?? r.supplementReason,
    reviewComment: r.review_comment ?? r.reviewComment,
    timeline,
  }
}

export function normalizePaginated<T, R>(
  raw: RawPaginatedResponse,
  normalizer: (item: unknown) => R
): PaginatedResponse<R> {
  const items = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.data) ? raw.data : []
  const page =
    typeof raw.page === 'string' ? parseInt(raw.page) : raw.page ?? 1
  const pageSize =
    typeof raw.page_size === 'string'
      ? parseInt(raw.page_size)
      : typeof raw.pageSize === 'string'
      ? parseInt(raw.pageSize)
      : raw.pageSize ?? 10
  const total =
    typeof raw.total === 'string' ? parseInt(raw.total) : raw.total ?? items.length

  return {
    data: items.map(normalizer),
    total,
    page,
    pageSize,
  }
}
