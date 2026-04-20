export interface SystemParam {
  key: string
  value: string
  description?: string
  type?: 'string' | 'number' | 'boolean'
  updatedAt?: string
}

export interface RawSystemParam {
  key?: string
  value?: string
  description?: string
  type?: string
  updated_at?: string
}

export interface RawPaginatedParamsResponse {
  items?: RawSystemParam[]
  data?: RawSystemParam[]
  page?: number | string
  page_size?: number | string
  pageSize?: number | string
  total?: number | string
}

export interface PaginatedParamsResponse {
  data: SystemParam[]
  total: number
  page: number
  pageSize: number
}

export function normalizeSystemParam(raw: RawSystemParam): SystemParam {
  return {
    key: raw.key ?? '',
    value: raw.value ?? '',
    description: raw.description,
    type: raw.type as SystemParam['type'],
    updatedAt: raw.updated_at,
  }
}

export function normalizePaginatedParams(
  raw: RawPaginatedParamsResponse
): PaginatedParamsResponse {
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
    data: items.map(normalizeSystemParam),
    total,
    page,
    pageSize,
  }
}
