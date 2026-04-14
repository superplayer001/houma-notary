import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, List, message, Modal, Input } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { staffApi } from '../../api/services'
import type { Application, ApplicationStatus } from '../../types'
import { APPLICATION_STATUS_MAP, BIZ_TYPE_OPTIONS } from '../../types'

const { confirm } = Modal
const { TextArea } = Input

export default function StaffApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<Application | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

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
    setActionLoading(true)
    try {
      await staffApi.assignCase(id)
      message.success('已分配案件')
      fetchData()
    } catch {
      message.error('分配失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSupplement = () => {
    if (!data) return
    let reason = ''
    confirm({
      title: '要求补件',
      icon: <ExclamationCircleOutlined />,
      content: (
        <Input.TextArea
          placeholder="请输入补件原因"
          rows={3}
          onChange={(e) => (reason = e.target.value)}
        />
      ),
      okText: '确认发送',
      cancelText: '取消',
      onOk: async () => {
        setActionLoading(true)
        try {
          await staffApi.supplementApplication(data.id, reason)
          message.success('已发送补件通知')
          fetchData()
        } catch {
          message.error('操作失败')
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const handleReject = () => {
    if (!data) return
    let reason = ''
    confirm({
      title: '确认驳回申请？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <Input.TextArea
          placeholder="请输入驳回原因"
          rows={3}
          onChange={(e) => (reason = e.target.value)}
        />
      ),
      okText: '确认驳回',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setActionLoading(true)
        try {
          await staffApi.rejectApplication(data.id, reason)
          message.success('申请已驳回')
          fetchData()
        } catch {
          message.error('操作失败')
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const getBizTypeLabel = (value: string) => {
    const option = BIZ_TYPE_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : value
  }

  if (!data) return null

  const s = APPLICATION_STATUS_MAP[data.status] || { color: 'default', text: data.status }

  return (
    <div>
      <Card
        title="申请详情"
        extra={
          <Space>
            <Button onClick={() => navigate('/staff/todos')}>返回待办</Button>
            {data.status === 'pending' && (
              <>
                <Button onClick={handleSupplement} loading={actionLoading}>
                  要求补件
                </Button>
                <Button danger onClick={handleReject} loading={actionLoading}>
                  驳回
                </Button>
                <Button type="primary" onClick={handleAssign} loading={actionLoading}>
                  受理
                </Button>
              </>
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
          <Descriptions.Item label="业务类型">{getBizTypeLabel(data.bizType)}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{data.createdAt}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{data.updatedAt}</Descriptions.Item>
          <Descriptions.Item label="标题" span={2}>{data.title}</Descriptions.Item>
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
