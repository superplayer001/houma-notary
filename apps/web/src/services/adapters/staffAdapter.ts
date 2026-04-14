import type { Application, Case, Material } from '../../types'
import { normalizeStatus } from './applicationAdapter'

export interface RawApplication {
  id?: string
  _id?: string
  user_id?: string
  userId?: string
  staff_id?: string
  staffId?: string
  biz_type?: string
  bizType?: string
  title?: string
  description?: string
  status?: string
  assigned_at?: string
  assignedAt?: string
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
  materialType?: string
  uploaded_at?: string
  uploadedAt?: string
  [key: string]: unknown
}

export interface RawCase {
  id?: string
  _id?: string
  case_no?: string
  caseNo?: string
  application_id?: string
  applicationId?: string
  staff_id?: string
  staffId?: string
  biz_type?: string
  bizType?: string
  status?: string
  result?: string
  certificate_no?: string
  certificateNo?: string
  verify_code?: string
  verifyCode?: string
  certificate_status?: string
  certificateStatus?: string
  issued_at?: string
  issuedAt?: string
  voided_at?: string
  voidedAt?: string
  void_reason?: string
  voidReason?: string
  accepted_at?: string
  acceptedAt?: string
  completed_at?: string
  completedAt?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
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

function normalizeMaterial(raw: RawMaterial): Material {
  return {
    id: raw.id ?? raw._id ?? '',
    name: raw.name ?? '',
    url: raw.url ?? '',
    type: raw.material_type ?? raw.materialType ?? raw.type ?? '',
    uploadedAt: raw.uploaded_at ?? raw.uploadedAt ?? '',
  }
}

export function normalizeApplication(raw: RawApplication): Application {
  return {
    id: raw.id ?? raw._id ?? '',
    userId: raw.user_id ?? raw.userId ?? '',
    staffId: raw.staff_id ?? raw.staffId,
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

function normalizeCaseStatus(raw: string): Case['status'] {
  const map: Record<string, Case['status']> = {
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    IN_PROGRESS2: 'in_progress',
    COMPLETED: 'completed',
    VOIDED: 'voided',
  }
  return map[raw.toUpperCase()] ?? (raw as Case['status'])
}

function normalizeCertificateStatus(raw: string): Case['certificateStatus'] {
  const map: Record<string, Case['certificateStatus']> = {
    ISSUED: 'issued',
    VOIDED: 'voided',
  }
  return map[raw.toUpperCase()] ?? (raw as Case['certificateStatus'])
}

export function normalizeCase(raw: RawCase): Case {
  return {
    id: raw.id ?? raw._id ?? '',
    caseNo: raw.case_no ?? raw.caseNo,
    applicationId: raw.application_id ?? raw.applicationId ?? '',
    staffId: raw.staff_id ?? raw.staffId,
    status: normalizeCaseStatus(raw.status ?? 'assigned'),
    bizType: raw.biz_type ?? raw.bizType,
    result: raw.result,
    certificateNo: raw.certificate_no ?? raw.certificateNo,
    verifyCode: raw.verify_code ?? raw.verifyCode,
    certificateStatus: raw.certificate_status
      ? normalizeCertificateStatus(raw.certificate_status)
      : raw.certificateStatus
      ? normalizeCertificateStatus(raw.certificateStatus)
      : undefined,
    issuedAt: raw.issued_at ?? raw.issuedAt,
    voidedAt: raw.voided_at ?? raw.voidedAt,
    voidReason: raw.void_reason ?? raw.voidReason,
    acceptedAt: raw.accepted_at ?? raw.acceptedAt,
    completedAt: raw.completed_at ?? raw.completedAt,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
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
