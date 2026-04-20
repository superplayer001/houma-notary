import { useState, useCallback } from 'react'
import { message } from 'antd'
import { listSystemParams } from '../services/api/adminParams'
import type { SystemParam, PaginatedParamsResponse } from '../services/adapters/paramsAdapter'

export function useSystemParams() {
  const [data, setData] = useState<SystemParam[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res: PaginatedParamsResponse = await listSystemParams()
      setData(res.data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载失败'
      setError(msg)
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    data,
    loading,
    error,
    load: fetch,
    refresh: fetch,
  }
}
