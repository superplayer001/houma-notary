import type { Material } from '../../types'
import { normalizeStatus } from './applicationAdapter'

export type CaseStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'UNDER_REVIEW'
  | 'WAITING_VIDEO'
  | 'WAITING_SIGN'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'ISSUED'
  | 'COMPLETED'
  | 'VOIDED'
  | 'CLOSED'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'voided'

export type CertificateStatus = 'ISSUED' | 'VOIDED' | 'issued' | 'voided'

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

export interface RawTimelineEvent {
  id?: string
  _id?: string
  scope?: string
  action_type?: string
  event?: string
  from_status?: string
  to_status?: string
  operator_type?: string
  operator?: string
  comment?: string
  created_at?: string
  createdAt?: string
  [key: string]: unknown
}

export interface RawApplication {
  id?: string
  _id?: string
  application_no?: string
  applicationNo?: string
  user_id?: string
  userId?: string
  biz_type?: string
  bizType?: string
  title?: string
  description?: string
  status?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  materials?: RawMaterial[]
  [key: string]: unknown
}

export interface RawCertificate {
  id?: string
  _id?: string
  certificate_no?: string
  certificateNo?: string
  verify_code?: string
  verifyCode?: string
  status?: string
  issued_at?: string
  issuedAt?: string
  voided_at?: string
  voidedAt?: string
  void_reason?: string
  voidReason?: string
  biz_type?: string
  bizType?: string
  digest?: string
  [key: string]: unknown
}

export interface RawCaseDetailResponse {
  case?: RawCase
  application?: RawApplication
  materials?: RawMaterial[]
  timeline?: RawTimelineEvent[]
  certificate?: RawCertificate
  latest_video_session?: Record<string, unknown>
  [key: string]: unknown
}

export interface CaseListItem {
  id: string
  caseNo: string
  applicationId: string
  staffId: string
  bizType: string
  status: CaseStatus
  acceptedAt: string
  createdAt: string
  updatedAt: string
}

export interface Certificate {
  id: string
  certificateNo: string
  verifyCode: string
  status: CertificateStatus
  issuedAt: string
  voidedAt: string
  voidReason: string
  bizType?: string
  digest?: string
}

export interface CaseApplication {
  id: string
  applicationNo: string
  userId: string
  bizType: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  materials: Material[]
}

export interface TimelineEvent {
  id: string
  event: string
  operator?: string
  comment?: string
  createdAt: string
}

export interface CaseDetail {
  id: string
  caseNo: string
  applicationId: string
  staffId: string
  bizType: string
  status: CaseStatus
  result: string
  certificateNo: string
  verifyCode: string
  certificateStatus: CertificateStatus
  issuedAt: string
  voidedAt: string
  voidReason: string
  acceptedAt: string
  completedAt: string
  createdAt: string
  updatedAt: string
  certificate: Certificate
  application: CaseApplication
  materials: Material[]
  timeline: TimelineEvent[]
  latestVideoSession: Record<string, unknown>
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
    name: raw.file_name ?? '',
    url: '',
    type: raw.material_type ?? '',
    uploadedAt: raw.created_at ?? '',
  }
}

function normalizeTimelineEvent(raw: RawTimelineEvent): TimelineEvent {
  return {
    id: raw.id ?? raw._id ?? '',
    event: raw.action_type ?? raw.event ?? '',
    operator: raw.operator_type ?? raw.operator,
    comment: raw.comment,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
  }
}

export function normalizeCaseStatus(raw: string): CaseStatus {
  const map: Record<string, CaseStatus> = {
    CREATED: 'CREATED',
    ASSIGNED: 'ASSIGNED',
    UNDER_REVIEW: 'UNDER_REVIEW',
    WAITING_VIDEO: 'WAITING_VIDEO',
    WAITING_SIGN: 'WAITING_SIGN',
    WAITING_APPROVAL: 'WAITING_APPROVAL',
    APPROVED: 'APPROVED',
    ISSUED: 'ISSUED',
    COMPLETED: 'COMPLETED',
    VOIDED: 'VOIDED',
    CLOSED: 'CLOSED',
    assigned: 'assigned',
    in_progress: 'in_progress',
    completed: 'completed',
    voided: 'voided',
  }
  return map[raw.toUpperCase()] ?? (raw as CaseStatus)
}

export function normalizeCertificateStatus(raw: string): CertificateStatus {
  const map: Record<string, CertificateStatus> = {
    ISSUED: 'ISSUED',
    VOIDED: 'VOIDED',
    issued: 'issued',
    voided: 'voided',
  }
  return map[raw.toUpperCase()] ?? (raw as CertificateStatus)
}

function normalizeCertificate(raw: RawCertificate): Certificate {
  const voided = (raw as unknown as { voided?: boolean }).voided
  return {
    id: raw.id ?? raw._id ?? '',
    certificateNo: raw.certificate_no ?? raw.certificateNo ?? '',
    verifyCode: raw.verify_code ?? raw.verifyCode ?? '',
    status: voided ? 'VOIDED' : 'ISSUED',
    issuedAt: raw.issued_at ?? raw.issuedAt ?? '',
    voidedAt: raw.voided_at ?? raw.voidedAt ?? '',
    voidReason: raw.void_reason ?? raw.voidReason ?? '',
    bizType: raw.biz_type ?? raw.bizType,
    digest: raw.digest,
  }
}

function normalizeCaseApplication(raw: RawApplication): CaseApplication {
  return {
    id: raw.id ?? raw._id ?? '',
    applicationNo: raw.application_no ?? raw.applicationNo ?? '',
    userId: '',
    bizType: raw.biz_type ?? raw.bizType ?? '',
    title: raw.title ?? '',
    description: '',
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
    materials: (raw.materials ?? []).map(normalizeMaterial),
  }
}

function normalizeCase(raw: RawCase): CaseDetail {
  return {
    id: raw.id ?? raw._id ?? '',
    caseNo: raw.case_no ?? raw.caseNo ?? '',
    applicationId: raw.application_id ?? raw.applicationId ?? '',
    staffId: raw.staff_id ?? raw.staffId ?? '',
    bizType: raw.biz_type ?? raw.bizType ?? '',
    status: normalizeCaseStatus(raw.status ?? 'CREATED'),
    result: raw.result ?? '',
    certificateNo: raw.certificate_no ?? raw.certificateNo ?? '',
    verifyCode: raw.verify_code ?? raw.verifyCode ?? '',
    certificateStatus: raw.certificate_status
      ? normalizeCertificateStatus(raw.certificate_status as string)
      : raw.certificateStatus
      ? normalizeCertificateStatus(raw.certificateStatus as string)
      : 'ISSUED',
    issuedAt: raw.issued_at ?? raw.issuedAt ?? '',
    voidedAt: raw.voided_at ?? raw.voidedAt ?? '',
    voidReason: raw.void_reason ?? raw.voidReason ?? '',
    acceptedAt: raw.accepted_at ?? raw.acceptedAt ?? '',
    completedAt: raw.completed_at ?? raw.completedAt ?? '',
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
    certificate: normalizeCertificate(raw as RawCertificate),
    application: normalizeCaseApplication(raw as RawApplication),
    materials: [],
    timeline: [],
    latestVideoSession: {},
  }
}

export function normalizeCaseListItem(raw: RawCase): CaseListItem {
  return {
    id: raw.id ?? raw._id ?? '',
    caseNo: raw.case_no ?? raw.caseNo ?? '',
    applicationId: raw.application_id ?? raw.applicationId ?? '',
    staffId: raw.staff_id ?? raw.staffId ?? '',
    bizType: raw.biz_type ?? raw.bizType ?? '',
    status: normalizeCaseStatus(raw.status ?? 'CREATED'),
    acceptedAt: raw.accepted_at ?? raw.acceptedAt ?? '',
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
  }
}

export function normalizeCaseDetailResponse(raw: RawCaseDetailResponse): CaseDetail {
  const c = raw.case ?? (raw as unknown as RawCase)
  const cert = raw.certificate ?? {}
  const app = raw.application ?? {}

  const certVoided = (cert as unknown as { voided?: boolean }).voided

  return {
    id: c.id ?? c._id ?? '',
    caseNo: c.case_no ?? c.caseNo ?? '',
    applicationId: app.id ?? '',
    staffId: '',
    bizType: c.biz_type ?? c.bizType ?? '',
    status: normalizeCaseStatus(c.status ?? 'CREATED'),
    result: '',
    certificateNo: cert.certificate_no ?? cert.certificateNo ?? '',
    verifyCode: cert.verify_code ?? cert.verifyCode ?? '',
    certificateStatus: certVoided ? 'VOIDED' : 'ISSUED',
    issuedAt: cert.issued_at ?? cert.issuedAt ?? '',
    voidedAt: cert.voided_at ?? cert.voidedAt ?? '',
    voidReason: cert.void_reason ?? cert.voidReason ?? '',
    acceptedAt: c.accepted_at ?? c.acceptedAt ?? '',
    completedAt: c.completed_at ?? c.completedAt ?? '',
    createdAt: c.created_at ?? c.createdAt ?? '',
    updatedAt: c.updated_at ?? c.updatedAt ?? '',
    certificate: normalizeCertificate(cert as RawCertificate),
    application: normalizeCaseApplication(app as RawApplication),
    materials: (raw.materials ?? []).map(normalizeMaterial),
    timeline: (raw.timeline ?? []).map(normalizeTimelineEvent),
    latestVideoSession: raw.latest_video_session ?? {},
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
