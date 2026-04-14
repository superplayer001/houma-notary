// External enforcement API adapter
// Normalizes snake_case (backend) ↔ camelCase (frontend)
// Backend path: POST/GET /api/v1/external/enforcement/applications

export interface SendEnforcementRequest {
  externalRequestNo?: string
  title: string
  applicantName: string
  applicantIdNo: string
  remark?: string
}

export interface SendEnforcementResponse {
  requestNo: string
}

export interface EnforcementQueryResponse {
  requestNo: string
  externalRequestNo: string
  sourceSystem: string
  bizType: string
  status: string
  currentStage: string
  applicationId?: string
  application?: {
    id: string
    applicationNo: string
    applicantName: string
    bizType: string
    status: string
  }
  case?: {
    id: string
    caseNo: string
    status: string
    result?: string
  }
  certificate?: {
    id: string
    certificateNo: string
    verifyCode: string
    verifyUrl: string
    status: string
    issuedAt: string
    digest?: string
  }
}

// Raw types from backend (snake_case)
export interface RawSendEnforcementRequest {
  external_request_no?: string
  title: string
  applicant_name: string
  applicant_id_no: string
  remark?: string
}

export interface RawSendEnforcementResponse {
  request_no: string
}

export interface RawEnforcementQueryResponse {
  request_no: string
  external_request_no: string
  source_system: string
  biz_type: string
  status: string
  current_stage: string
  application_id?: string
  application?: {
    id: string
    application_no: string
    applicant_name: string
    biz_type: string
    status: string
  }
  case?: {
    id: string
    case_no: string
    status: string
    result?: string
  }
  certificate?: {
    id: string
    certificate_no: string
    verify_code: string
    verify_url: string
    status: string
    issued_at: string
    digest?: string
  }
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

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// --- Normalizers ---

export function normalizeSendResponse(raw: RawSendEnforcementResponse): SendEnforcementResponse {
  return {
    requestNo: raw.request_no ?? '',
  }
}

export function normalizeEnforcementQuery(raw: RawEnforcementQueryResponse): EnforcementQueryResponse {
  return {
    requestNo: raw.request_no ?? '',
    externalRequestNo: raw.external_request_no ?? '',
    sourceSystem: raw.source_system ?? '',
    bizType: raw.biz_type ?? '',
    status: raw.status ?? '',
    currentStage: raw.current_stage ?? '',
    applicationId: raw.application_id,
    application: raw.application
      ? {
          id: raw.application.id,
          applicationNo: raw.application.application_no,
          applicantName: raw.application.applicant_name,
          bizType: raw.application.biz_type,
          status: raw.application.status,
        }
      : undefined,
    case: raw.case
      ? {
          id: raw.case.id,
          caseNo: raw.case.case_no,
          status: raw.case.status,
          result: raw.case.result,
        }
      : undefined,
    certificate: raw.certificate
      ? {
          id: raw.certificate.id,
          certificateNo: raw.certificate.certificate_no,
          verifyCode: raw.certificate.verify_code,
          verifyUrl: raw.certificate.verify_url,
          status: raw.certificate.status,
          issuedAt: raw.certificate.issued_at,
          digest: raw.certificate.digest,
        }
      : undefined,
  }
}

export function toRawSendRequest(req: SendEnforcementRequest): RawSendEnforcementRequest {
  return {
    external_request_no: req.externalRequestNo,
    title: req.title,
    applicant_name: req.applicantName,
    applicant_id_no: req.applicantIdNo,
    remark: req.remark,
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
