export interface AuditLogEntry {
  id: string
  entityType: string
  entityId: string
  action: string
  operatorType: string
  operatorId: string
  operatorName?: string
  detailJson?: Record<string, unknown>
  ip?: string
  createdAt: string
}

export interface RawAuditLogEntry {
  id?: string
  entity_type?: string
  entity_id?: string
  action?: string
  operator_type?: string
  operator_id?: string
  operator_name?: string
  detail_json?: Record<string, unknown>
  ip?: string
  created_at?: string
}

export interface RawPaginatedAuditResponse {
  items?: RawAuditLogEntry[]
  data?: RawAuditLogEntry[]
  page?: number | string
  page_size?: number | string
  pageSize?: number | string
  total?: number | string
}

export interface PaginatedAuditResponse {
  data: AuditLogEntry[]
  total: number
  page: number
  pageSize: number
}

export function normalizeAuditEntry(raw: RawAuditLogEntry): AuditLogEntry {
  return {
    id: raw.id ?? '',
    entityType: raw.entity_type ?? '',
    entityId: raw.entity_id ?? '',
    action: raw.action ?? '',
    operatorType: raw.operator_type ?? '',
    operatorId: raw.operator_id ?? '',
    operatorName: raw.operator_name,
    detailJson: raw.detail_json,
    ip: raw.ip,
    createdAt: raw.created_at ?? '',
  }
}

export function normalizePaginatedAudit(
  raw: RawPaginatedAuditResponse
): PaginatedAuditResponse {
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
    data: items.map(normalizeAuditEntry),
    total,
    page,
    pageSize,
  }
}
