import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, message, Alert, Modal, Spin } from 'antd'
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useApplicationDetail } from '../../hooks/useApplicationDetail'
import FileUpload from '../../components/FileUpload'
import { APPLICATION_STATUS_MAP } from '../../types'
import { getBizTypeLabel } from '../../services/adapters/applicationAdapter'

const { confirm } = Modal

export default function UserApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: app, loading, actionLoading, fetch, submit, withdraw, submitSupplement } = useApplicationDetail(id ?? '')

  useEffect(() => { fetch() }, [fetch])

  const handleSubmit = () => {
    if (!app) return
    confirm({
      title: '确认提交申请？',
      icon: <ExclamationCircleOutlined />,
      content: '提交后将进入审核流程，是否继续？',
      okText: '确认提交',
      cancelText: '取消',
      onOk: async () => {
        try {
          await submit()
          message.success('申请已提交')
        } catch {
          message.error('提交失败')
        }
      },
    })
  }

  const handleWithdraw = () => {
    if (!app) return
    confirm({
      title: '确认撤回申请？',
      icon: <ExclamationCircleOutlined />,
      content: '撤回后申请将被取消，是否继续？',
      okText: '确认撤回',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await withdraw()
          message.success('申请已撤回')
        } catch {
          message.error('撤回失败')
        }
      },
    })
  }

  const handleSubmitSupplement = () => {
    if (!app) return
    confirm({
      title: '确认提交补件？',
      icon: <CheckCircleOutlined />,
      content: '请确保已上传所有补件材料，提交后将重新进入审核。',
      okText: '确认提交',
      cancelText: '取消',
      onOk: async () => {
        try {
          await submitSupplement()
          message.success('补件已提交')
        } catch {
          message.error('提交失败')
        }
      },
    })
  }

  if (loading && !app) {
    return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>
  }

  if (!app) {
    return <Alert message="加载失败" description="无法获取申请详情，请返回列表重试。" type="error" showIcon />
  }

  const s = APPLICATION_STATUS_MAP[app.status] ?? { color: 'default', text: app.status }

  const canSubmit = app.status === 'draft'
  const canWithdraw = app.status === 'draft' || app.status === 'submitted'
  const canSupplement = app.status === 'supplement_required'
  const canUpload = app.status === 'draft' || app.status === 'submitted' || app.status === 'supplement_required'
  const uploadDisabled = !canUpload

  return (
    <div>
      {app.status === 'supplement_required' && app.supplementReason && (
        <Alert
          message="补件通知"
          description={<><strong>补件原因：</strong>{app.supplementReason}</>}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title="申请详情"
        extra={
          <Space>
            {canSubmit && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleSubmit} loading={actionLoading}>
                提交申请
              </Button>
            )}
            {canWithdraw && (
              <Button danger onClick={handleWithdraw} loading={actionLoading}>
                撤回申请
              </Button>
            )}
            <Button onClick={() => navigate('/user/applications')}>返回列表</Button>
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="ID">{app.id}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={s.color}>{s.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="业务类型">{getBizTypeLabel(app.bizType)}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{app.createdAt}</Descriptions.Item>
          <Descriptions.Item label="标题" span={2}>{app.title}</Descriptions.Item>
          {app.description && <Descriptions.Item label="描述" span={2}>{app.description}</Descriptions.Item>}
          {app.updatedAt !== app.createdAt && (
            <Descriptions.Item label="更新时间">{app.updatedAt}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="申请材料" style={{ marginTop: 16 }}>
        <FileUpload
          applicationId={app.id}
          materials={app.materials ?? []}
          onSuccess={fetch}
          disabled={uploadDisabled}
          showSubmitSupplement={canSupplement}
          onSubmitSupplement={handleSubmitSupplement}
          submitLoading={actionLoading}
        />
      </Card>
    </div>
  )
}
