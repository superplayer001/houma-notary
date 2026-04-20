import { useState, useCallback } from 'react'
import { message } from 'antd'
import {
  listPendingApplications,
  type PendingApplication,
  type PaginationParams,
} from '../services/api/staffApplications'
import type { PaginatedResponse } from '../services/adapters/staffApplicationAdapter'

export function useStaffPendingApplications() {
  const [data, setData] = useState<PendingApplication[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (p?: number, ps?: number) => {
    setLoading(true)
    setError(null)
    try {
      const res: PaginatedResponse<PendingApplication> = await listPendingApplications({
        page: p ?? page,
        page_size: ps ?? pageSize,
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
  }, [page, pageSize])

  const load = useCallback((p = 1, ps = 10) => {
    setPage(p)
    setPageSize(ps)
    return fetch(p, ps)
  }, [fetch])

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
