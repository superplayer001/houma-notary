import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, message, Alert, Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { userApi } from '../../api/services'
import FileUpload from '../../components/FileUpload'
import type { Application } from '../../types'
import { APPLICATION_STATUS_MAP, BIZ_TYPE_OPTIONS } from '../../types'

const { confirm } = Modal

export default function UserApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<Application | null>(null)
  const [loading, setLoading] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

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

  const handleWithdraw = () => {
    if (!data) return
    confirm({
      title: '确认撤回申请？',
      icon: <ExclamationCircleOutlined />,
      content: '撤回后申请将被取消，是否继续？',
      okText: '确认撤回',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setWithdrawing(true)
        try {
          await userApi.withdrawApplication(data.id)
          message.success('申请已撤回')
          fetchData()
        } catch {
          message.error('撤回失败')
        } finally {
          setWithdrawing(false)
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

  const showSupplementAlert = data.status === 'pending' || data.status === 'processing'

  return (
    <div>
      {showSupplementAlert && (
        <Alert
          message="补件提示"
          description="您的申请需要补充相关材料，请上传缺失的材料后等待审核。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title="申请详情"
        extra={
          <Space>
            {(data.status === 'pending' || data.status === 'draft') && (
              <Button
                danger
                loading={withdrawing}
                onClick={handleWithdraw}
              >
                撤回申请
              </Button>
            )}
            <Button onClick={() => navigate('/user/applications')}>返回列表</Button>
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="ID">{data.id}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={s.color}>{s.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="业务类型">{getBizTypeLabel(data.bizType)}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{data.createdAt}</Descriptions.Item>
          <Descriptions.Item label="标题" span={2}>{data.title}</Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>{data.description}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="申请材料" style={{ marginTop: 16 }}>
        <FileUpload
          applicationId={data.id}
          materials={data.materials || []}
          onSuccess={fetchData}
          disabled={data.status === 'completed' || data.status === 'rejected' || data.status === 'voided'}
        />
      </Card>
    </div>
  )
}
