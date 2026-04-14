import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, Input, message, Timeline, Alert, Modal, ModalProps } from 'antd'
import { CheckCircleFilled, ClockCircleFilled, ExclamationCircleOutlined, CloseCircleFilled, FileTextOutlined } from '@ant-design/icons'
import { getCase, completeCase, voidCase } from '../../services/api/staff'
import type { Case } from '../../types'
import { CASE_STATUS_MAP, CERTIFICATE_STATUS_MAP } from '../../types'

const { TextArea } = Input

export default function StaffCaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getCase(id)
      setData(res)
      setResult(res.result || '')
    } catch {
      message.error('加载案件详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleComplete = async () => {
    if (!id) return
    if (!result.trim()) { message.warning('请输入处理结果'); return }
    setActionLoading(true)
    try {
      await completeCase(id, result)
      message.success('案件已完成')
      fetchData()
    } catch {
      message.error('操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleVoidCase = () => {
    if (!data) return
    let reason = ''
    const props: ModalProps = {
      title: '确认作废此案件？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <Input.TextArea
          placeholder="请输入作废原因"
          rows={3}
          onChange={(e) => { reason = e.target.value }}
        />
      ),
      okText: '确认作废',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        if (!reason.trim()) { message.warning('请输入作废原因'); return }
        setActionLoading(true)
        try {
          await voidCase(data.id, reason)
          message.success('案件已作废')
          fetchData()
        } catch {
          message.error('操作失败')
        } finally {
          setActionLoading(false)
        }
      },
    }
    Modal.confirm(props)
  }

  if (loading && !data) return null
  if (!data) return <Alert message="加载失败" description="无法获取案件详情。" type="error" showIcon />

  const s = CASE_STATUS_MAP[data.status] || { color: 'default', text: data.status }

  const timelineItems = [
    { color: 'green', dot: <CheckCircleFilled />, children: `案件创建 - ${data.createdAt}` },
  ]
  if (data.acceptedAt) {
    timelineItems.push({ color: 'blue', dot: <ClockCircleFilled />, children: `案件受理 - ${data.acceptedAt}` })
  }
  if (data.status === 'in_progress') {
    timelineItems.push({ color: 'orange', dot: <ClockCircleFilled />, children: `办理中 - ${data.updatedAt}` })
  }
  if (data.completedAt) {
    timelineItems.push({ color: data.certificateStatus === 'voided' ? 'red' : 'green', dot: data.certificateStatus === 'voided' ? <CloseCircleFilled /> : <CheckCircleFilled />, children: `案件完成 - ${data.completedAt}` })
  }
  if (data.status === 'voided') {
    timelineItems.push({ color: 'red', dot: <CloseCircleFilled />, children: `案件作废 - ${data.updatedAt}` })
  }

  const certStatus = data.certificateStatus ? CERTIFICATE_STATUS_MAP[data.certificateStatus] : null

  return (
    <div>
      <Card
        title="案件详情"
        extra={
          <Space>
            {data.status !== 'completed' && data.status !== 'voided' && (
              <Button danger onClick={handleVoidCase} loading={actionLoading}>
                作废案件
              </Button>
            )}
            <Button onClick={() => navigate('/staff/cases')}>返回列表</Button>
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="案件ID">{data.id}</Descriptions.Item>
          <Descriptions.Item label="申请ID">{data.applicationId}</Descriptions.Item>
          <Descriptions.Item label="处理人">{data.staffId || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={s.color}>{s.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="业务类型">{data.bizType || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{data.createdAt}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{data.updatedAt}</Descriptions.Item>
          {data.caseNo && <Descriptions.Item label="案件编号">{data.caseNo}</Descriptions.Item>}
        </Descriptions>
      </Card>

      <Card title="办理进度" style={{ marginTop: 16 }}>
        <Timeline items={timelineItems} />
      </Card>

      {(data.status === 'completed' || data.certificateStatus) && (
        <Card title="公证证书" style={{ marginTop: 16 }}>
          <Alert
            message="证书信息"
            type={data.certificateStatus === 'voided' ? 'error' : 'info'}
            showIcon
            icon={data.certificateStatus === 'voided' ? <CloseCircleFilled /> : <FileTextOutlined />}
            description={
              <>
                <Descriptions column={2} bordered size="small" style={{ marginTop: 12 }}>
                  <Descriptions.Item label="证书编号">{data.certificateNo || '待生成'}</Descriptions.Item>
                  <Descriptions.Item label="验真码">{data.verifyCode || '待生成'}</Descriptions.Item>
                  <Descriptions.Item label="证书状态">
                    {certStatus ? <Tag color={certStatus.color}>{certStatus.text}</Tag> : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="出证时间">{data.issuedAt || '-'}</Descriptions.Item>
                  {data.certificateStatus === 'voided' && (
                    <>
                      <Descriptions.Item label="作废时间">{data.voidedAt || '-'}</Descriptions.Item>
                      <Descriptions.Item label="作废原因" span={2}>
                        <Tag color="red">{data.voidReason || '-'}</Tag>
                      </Descriptions.Item>
                    </>
                  )}
                </Descriptions>
                {data.certificateStatus === 'voided' && (
                  <Alert message="此证书已被作废，不再有效" type="error" showIcon style={{ marginTop: 12 }} />
                )}
              </>
            }
          />
        </Card>
      )}

      {data.status !== 'completed' && data.status !== 'voided' && (
        <Card title="处理结果" style={{ marginTop: 16 }}>
          <TextArea rows={4} value={result} onChange={(e) => setResult(e.target.value)} placeholder="请输入处理结果，如：公证事项已完成，证书编号 XXX ..." />
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" onClick={handleComplete} loading={actionLoading} disabled={!result.trim()}>
              完成案件
            </Button>
          </Space>
        </Card>
      )}
    </div>
  )
}
