import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, Input, message, Timeline, Alert } from 'antd'
import { CheckCircleFilled, ClockCircleFilled } from '@ant-design/icons'
import { staffApi } from '../../api/services'
import type { Case } from '../../types'
import { CASE_STATUS_MAP } from '../../types'

const { TextArea } = Input

export default function StaffCaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await staffApi.getCase(id)
      setData(res.data)
      setResult(res.data.result || '')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleComplete = async () => {
    if (!id) return
    try {
      await staffApi.completeCase(id, result)
      message.success('案件已完成')
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  if (!data) return null

  const s = CASE_STATUS_MAP[data.status] || { color: 'default', text: data.status }

  const timelineItems = [
    { color: 'green', dot: <CheckCircleFilled />, children: `案件创建 - ${data.createdAt}` },
  ]

  if (data.acceptedAt) {
    timelineItems.push({ color: 'blue', dot: <ClockCircleFilled />, children: `案件受理 - ${data.acceptedAt}` })
  }

  if (data.completedAt) {
    timelineItems.push({ color: 'green', dot: <CheckCircleFilled />, children: `案件完成 - ${data.completedAt}` })
  }

  return (
    <div>
      <Card
        title="案件详情"
        extra={
          <Button onClick={() => navigate('/staff/cases')}>返回列表</Button>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="ID">{data.id}</Descriptions.Item>
          <Descriptions.Item label="申请ID">{data.applicationId}</Descriptions.Item>
          <Descriptions.Item label="处理人ID">{data.staffId}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={s.color}>{s.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{data.createdAt}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{data.updatedAt}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="办理进度" style={{ marginTop: 16 }}>
        <Timeline items={timelineItems} />
      </Card>

      {data.status === 'completed' && (
        <Card title="公证证书" style={{ marginTop: 16 }}>
          <Alert
            message="证书信息"
            description={
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="证书编号">{data.certificateNo || '待生成'}</Descriptions.Item>
                <Descriptions.Item label="验真码">{data.verifyCode || '待生成'}</Descriptions.Item>
              </Descriptions>
            }
            type="info"
            showIcon
          />
        </Card>
      )}

      {data.status !== 'completed' && data.status !== 'voided' && (
        <Card title="处理结果" style={{ marginTop: 16 }}>
          <TextArea
            rows={4}
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="请输入处理结果..."
          />
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" onClick={handleComplete}>完成案件</Button>
          </Space>
        </Card>
      )}
    </div>
  )
}
