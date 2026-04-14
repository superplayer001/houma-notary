import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, List, Space, message } from 'antd'
import { userApi } from '../../api/services'
import FileUpload from '../../components/FileUpload'
import type { Application } from '../../types'

export default function UserApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<Application | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await userApi.getApplication(id)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

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
            <Button onClick={() => navigate('/user/applications')}>返回列表</Button>
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="ID">{data.id}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={s.color}>{s.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="类型">{data.type}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{data.createdAt}</Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>{data.description}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="申请材料" style={{ marginTop: 16 }}>
        <FileUpload
          applicationId={data.id}
          materials={data.materials || []}
          onSuccess={fetchData}
        />
      </Card>
    </div>
  )
}
