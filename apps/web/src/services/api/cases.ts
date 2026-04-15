import { client } from '../request'
import {
  normalizeCaseListItem,
  normalizeCaseDetailResponse,
  normalizePaginated,
  type RawPaginatedResponse,
  type RawCaseDetailResponse,
  type PaginatedResponse,
  type CaseListItem,
  type CaseDetail,
} from '../adapters/caseAdapter'
export type { CaseDetail }

export interface ListCasesParams {
  page?: number
  page_size?: number
  biz_type?: string
  status?: string
}

export async function listCases(params?: ListCasesParams): Promise<PaginatedResponse<CaseListItem>> {
  const res = await client.get<RawPaginatedResponse>('/staff/cases', { params })
  return normalizePaginated(res.data, normalizeCaseListItem as (item: unknown) => CaseListItem)
}

export async function getCase(id: string): Promise<CaseDetail> {
  const res = await client.get<RawCaseDetailResponse>(`/staff/cases/${id}`)
  return normalizeCaseDetailResponse(res.data)
}

export async function advanceStatus(id: string, toStatus: string, comment: string): Promise<CaseDetail> {
  const res = await client.post<RawCaseDetailResponse>(`/staff/cases/${id}/advance-status`, {
    to_status: toStatus,
    comment,
  })
  return normalizeCaseDetailResponse(res.data)
}

export async function issueCertificate(id: string, comment: string): Promise<CaseDetail> {
  const res = await client.post<RawCaseDetailResponse>(`/staff/cases/${id}/issue`, { comment })
  return normalizeCaseDetailResponse(res.data)
}

export async function voidCase(id: string, comment: string): Promise<CaseDetail> {
  const res = await client.post<RawCaseDetailResponse>(`/staff/cases/${id}/void`, { comment })
  return normalizeCaseDetailResponse(res.data)
}
