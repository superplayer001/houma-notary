import { useState, useCallback } from 'react'
import { message } from 'antd'
import {
  getApplicationDetail,
  requireSupplement,
  rejectApplication,
  acceptApplication,
  type StaffApplicationDetail,
} from '../services/api/staffApplications'

export function useStaffApplicationDetail(id: string) {
  const [data, setData] = useState<StaffApplicationDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await getApplicationDetail(id)
      setData(res)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载失败'
      setError(msg)
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }, [id])

  const handleRequireSupplement = useCallback(async (comment: string) => {
    if (!id || !comment.trim()) {
      message.warning('请输入补件原因')
      return
    }
    setActionLoading(true)
    try {
      await requireSupplement(id, comment)
      message.success('已发送补件通知')
      await fetch()
    } catch {
      message.error('操作失败')
    } finally {
      setActionLoading(false)
    }
  }, [id, fetch])

  const handleReject = useCallback(async (comment: string) => {
    if (!id || !comment.trim()) {
      message.warning('请输入驳回原因')
      return
    }
    setActionLoading(true)
    try {
      await rejectApplication(id, comment)
      message.success('申请已驳回')
      await fetch()
    } catch {
      message.error('操作失败')
    } finally {
      setActionLoading(false)
    }
  }, [id, fetch])

  const handleAccept = useCallback(async (comment: string) => {
    if (!id) return
    setActionLoading(true)
    try {
      await acceptApplication(id, comment)
      message.success('已受理')
      await fetch()
    } catch {
      message.error('操作失败')
    } finally {
      setActionLoading(false)
    }
  }, [id, fetch])

  return {
    data,
    loading,
    actionLoading,
    error,
    fetch,
    handleRequireSupplement,
    handleReject,
    handleAccept,
  }
}
