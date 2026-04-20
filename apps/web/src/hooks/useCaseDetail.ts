import { useState, useCallback } from 'react'
import { message } from 'antd'
import {
  getCase,
  advanceStatus,
  issueCertificate,
  voidCase,
  type CaseDetail,
} from '../services/api/cases'
import { voidCertificate } from '../services/api/certificates'

export function useCaseDetail(id: string) {
  const [data, setData] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await getCase(id)
      setData(res)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载失败'
      setError(msg)
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }, [id])

  const handleAdvanceStatus = useCallback(async (toStatus: string, comment: string) => {
    if (!id) return
    setActionLoading(true)
    try {
      const res = await advanceStatus(id, toStatus, comment)
      setData(res)
      message.success('状态已更新')
    } catch {
      message.error('状态推进失败')
    } finally {
      setActionLoading(false)
    }
  }, [id])

  const handleIssue = useCallback(async (comment: string) => {
    if (!id) return
    setActionLoading(true)
    try {
      const res = await issueCertificate(id, comment)
      setData(res)
      message.success('出证成功')
    } catch {
      message.error('出证失败')
    } finally {
      setActionLoading(false)
    }
  }, [id])

  const handleVoidCase = useCallback(async (comment: string) => {
    if (!id) return
    setActionLoading(true)
    try {
      const res = await voidCase(id, comment)
      setData(res)
      message.success('案件已作废')
    } catch {
      message.error('案件作废失败')
    } finally {
      setActionLoading(false)
    }
  }, [id])

  const handleVoidCertificate = useCallback(async (certificateId: string, comment: string) => {
    setActionLoading(true)
    try {
      const res = await voidCertificate(certificateId, comment)
      setData(res)
      message.success('证书已作废')
    } catch {
      message.error('证书作废失败')
    } finally {
      setActionLoading(false)
    }
  }, [])

  return {
    data,
    loading,
    actionLoading,
    error,
    fetch,
    handleAdvanceStatus,
    handleIssue,
    handleVoidCase,
    handleVoidCertificate,
  }
}
