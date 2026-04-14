import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, List, message } from 'antd'
import { staffApi } from '../../api/services'
import type { Application } from '../../types'

export default function StaffApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<Application | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await staffApi.getApplication(id)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleAssign = async () => {
    if (!id) return
    try {
      await staffApi.assignCase(id)
      message.success('已分配案件')
      fetchData()
    } catch {
      message.error('分配失败')
    }
  }

  if (!data) return null

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    pending: { color: 'orange', text: '待处理' },
    processing: { color: 'blue', text: '处理中' },
    completed: { color: 'green', text: '已完成' },
    rejected: { color: 'red', text: '已拒绝' },
  }

  const s = statusMap[data.status] || { color: 'default', text: data.status }

  return (
    <div>
      <Card
        title="申请详情"
        extra={
          <Space>
            <Button onClick={() => navigate('/staff/todos')}>返回待办</Button>
            {data.status === 'pending' && (
              <Button type="primary" onClick={handleAssign}>接单处理</Button>
            )}
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="ID">{data.id}</Descriptions.Item>
          <Descriptions.Item label="用户ID">{data.userId}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={s.color}>{s.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="类型">{data.type}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{data.createdAt}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{data.updatedAt}</Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>{data.description}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="申请材料" style={{ marginTop: 16 }}>
        <List
          itemLayout="horizontal"
          dataSource={data.materials || []}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={<a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a>}
                description={`类型: ${item.type} | 上传时间: ${item.uploadedAt}`}
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无材料' }}
        />
      </Card>
    </div>
  )
}
