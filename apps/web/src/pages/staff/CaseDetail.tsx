import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, Input, message } from 'antd'
import { staffApi } from '../../api/services'
import type { Case } from '../../types'

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

  const statusMap: Record<string, { color: string; text: string }> = {
    assigned: { color: 'blue', text: '已分配' },
    in_progress: { color: 'orange', text: '进行中' },
    completed: { color: 'green', text: '已完成' },
  }

  const s = statusMap[data.status] || { color: 'default', text: data.status }

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

      {data.status !== 'completed' && (
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
