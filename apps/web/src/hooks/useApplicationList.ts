import { useState, useCallback } from 'react'
import type { Application } from '../types'
import { isMockMode } from '../services/request'
import {
  listApplications,
} from '../services/api/applications'
import {
  MOCK_APPLICATIONS,
} from '../services/mock'

export interface UseApplicationListResult {
  data: Application[]
  loading: boolean
  pagination: { current: number; pageSize: number; total: number }
  fetch: (page?: number, pageSize?: number) => Promise<void>
  error: string | null
}

export function useApplicationList(): UseApplicationListResult {
  const [data, setData] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const fetch = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true)
    setError(null)
    try {
      if (isMockMode()) {
        await new Promise(r => setTimeout(r, 300))
        const start = (page - 1) * pageSize
        const items = MOCK_APPLICATIONS.slice(start, start + pageSize)
        setData(items)
        setPagination({ current: page, pageSize, total: MOCK_APPLICATIONS.length })
      } else {
        const res = await listApplications({ page, page_size: pageSize })
        setData(res.data)
        setPagination({ current: res.page, pageSize: res.pageSize, total: res.total })
      }
    } catch (e) {
      setError('加载申请列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, pagination, fetch, error }
}
