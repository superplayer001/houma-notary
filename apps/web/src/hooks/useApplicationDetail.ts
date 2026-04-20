import { useState, useCallback } from 'react'
import type { Application } from '../types'
import { isMockMode } from '../services/request'
import {
  getApplication,
  submitApplication,
  withdrawApplication,
  submitSupplement,
} from '../services/api/applications'
import {
  MOCK_APPLICATIONS,
  mockSubmitApplication,
  mockWithdrawApplication,
  mockSubmitSupplement,
} from '../services/mock'

export interface UseApplicationDetailResult {
  data: Application | null
  loading: boolean
  actionLoading: boolean
  error: string | null
  fetch: () => Promise<void>
  submit: () => Promise<void>
  withdraw: (comment?: string) => Promise<void>
  submitSupplement: () => Promise<void>
}

export function useApplicationDetail(id: string): UseApplicationDetailResult {
  const [data, setData] = useState<Application | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (isMockMode()) {
        await new Promise(r => setTimeout(r, 300))
        const app = MOCK_APPLICATIONS.find(a => a.id === id) ?? null
        setData(app)
      } else {
        const app = await getApplication(id)
        setData(app)
      }
    } catch {
      setError('加载申请详情失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  const submit = useCallback(async () => {
    setActionLoading(true)
    try {
      if (isMockMode()) {
        await new Promise(r => setTimeout(r, 300))
        const updated = mockSubmitApplication(id)
        setData(updated)
      } else {
        const updated = await submitApplication(id)
        setData(updated)
      }
    } finally {
      setActionLoading(false)
    }
  }, [id])

  const withdraw = useCallback(async (comment?: string) => {
    setActionLoading(true)
    try {
      if (isMockMode()) {
        await new Promise(r => setTimeout(r, 300))
        const updated = mockWithdrawApplication(id)
        setData(updated)
      } else {
        await withdrawApplication(id, comment)
        await fetch()
      }
    } finally {
      setActionLoading(false)
    }
  }, [id, fetch])

  const doSubmitSupplement = useCallback(async () => {
    setActionLoading(true)
    try {
      if (isMockMode()) {
        await new Promise(r => setTimeout(r, 300))
        const updated = mockSubmitSupplement(id)
        setData(updated)
      } else {
        const updated = await submitSupplement(id)
        setData(updated)
      }
    } finally {
      setActionLoading(false)
    }
  }, [id])

  return { data, loading, actionLoading, error, fetch, submit, withdraw, submitSupplement: doSubmitSupplement }
}
