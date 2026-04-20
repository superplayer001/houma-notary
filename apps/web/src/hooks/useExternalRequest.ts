import { useState, useCallback } from 'react'
import { message } from 'antd'
import {
  sendEnforcementApplication,
  queryEnforcementApplication,
  type SendExternalRequest,
} from '../services/api/adminExternal'
import type { SendEnforcementResponse, EnforcementQueryResponse } from '../services/adapters/externalAdapter'

export function useExternalRequest() {
  const [sendLoading, setSendLoading] = useState(false)
  const [queryLoading, setQueryLoading] = useState(false)
  const [sendResult, setSendResult] = useState<SendEnforcementResponse | null>(null)
  const [queryResult, setQueryResult] = useState<EnforcementQueryResponse | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)

  const handleSend = useCallback(async (data: SendExternalRequest) => {
    setSendLoading(true)
    setSendError(null)
    setSendResult(null)
    try {
      const res = await sendEnforcementApplication(data)
      setSendResult(res)
      message.success(`请求已发送，请求编号：${res.requestNo}`)
      return res
    } catch (err) {
      const msg = err instanceof Error ? err.message : '发送失败'
      setSendError(msg)
      message.error(msg)
      throw err
    } finally {
      setSendLoading(false)
    }
  }, [])

  const handleQuery = useCallback(async (requestNo: string, sourceSystem: string) => {
    if (!requestNo.trim()) {
      message.warning('请输入请求编号')
      return
    }
    setQueryLoading(true)
    setQueryError(null)
    setQueryResult(null)
    try {
      const res = await queryEnforcementApplication(requestNo, sourceSystem)
      setQueryResult(res)
      return res
    } catch (err) {
      const msg = err instanceof Error ? err.message : '查询失败'
      setQueryError(msg)
      message.error(msg)
      throw err
    } finally {
      setQueryLoading(false)
    }
  }, [])

  return {
    sendLoading,
    queryLoading,
    sendResult,
    queryResult,
    sendError,
    queryError,
    handleSend,
    handleQuery,
  }
}
