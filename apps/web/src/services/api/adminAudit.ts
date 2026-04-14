import { client } from '../request'
import {
  normalizeAuditEntry,
  normalizePaginatedAudit,
  type AuditLogEntry,
  type PaginatedAuditResponse,
  type RawPaginatedAuditResponse,
} from '../adapters/auditAdapter'

export interface ListAuditLogsParams {
  page?: number
  page_size?: number
  entity_type?: string
  action?: string
  operator_type?: string
  keyword?: string
  start_date?: string
  end_date?: string
}

export async function listAuditLogs(
  params?: ListAuditLogsParams
): Promise<PaginatedAuditResponse> {
  const res = await client.get<RawPaginatedAuditResponse>('/admin/audit-logs', { params })
  return normalizePaginatedAudit(res.data)
}
