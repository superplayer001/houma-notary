import { useState, useCallback } from 'react'
import { message } from 'antd'
import { listAuditLogs, type ListAuditLogsParams } from '../services/api/adminAudit'
import type { AuditLogEntry, PaginatedAuditResponse } from '../services/adapters/auditAdapter'

export function useAuditLogs() {
  const [data, setData] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(
    async (p?: number, ps?: number, filters?: Omit<ListAuditLogsParams, 'page' | 'page_size'>) => {
      setLoading(true)
      setError(null)
      try {
        const res: PaginatedAuditResponse = await listAuditLogs({
          page: p ?? page,
          page_size: ps ?? pageSize,
          ...filters,
        })
        setData(res.data)
        setTotal(res.total)
        setPage(res.page)
        setPageSize(res.pageSize)
      } catch (err) {
        const msg = err instanceof Error ? err.message : '加载失败'
        setError(msg)
        message.error(msg)
      } finally {
        setLoading(false)
      }
    },
    [page, pageSize]
  )

  const load = useCallback(
    (p = 1, ps = 10, filters?: Omit<ListAuditLogsParams, 'page' | 'page_size'>) => {
      setPage(p)
      setPageSize(ps)
      return fetch(p, ps, filters)
    },
    [fetch]
  )

  return {
    data,
    total,
    page,
    pageSize,
    loading,
    error,
    load,
    refresh: () => fetch(page, pageSize),
  }
}
