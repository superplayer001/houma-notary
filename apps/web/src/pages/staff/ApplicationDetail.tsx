import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, List, message, Modal, Input, Timeline, Empty, Spin } from 'antd'
import { ExclamationCircleOutlined, CheckCircleFilled, ClockCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import { useStaffApplicationDetail } from '../../hooks/useStaffApplicationDetail'
import { BIZ_TYPE_OPTIONS } from '../../types'

const { TextArea } = Input

export default function StaffApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    data,
    loading,
    actionLoading,
    fetch,
    handleRequireSupplement,
    handleReject,
    handleAccept,
  } = useStaffApplicationDetail(id ?? '')

  useEffect(() => {
    fetch()
  }, [id])

  const getBizTypeLabel = (value: string) => {
    const option = BIZ_TYPE_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : value
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      SUBMITTED: { color: 'blue', text: '已提交' },
      DRAFT: { color: 'default', text: '草稿' },
      SUPPLEMENT_REQUIRED: { color: 'orange', text: '待补件' },
      ACCEPTED: { color: 'green', text: '已受理' },
      REJECTED: { color: 'red', text: '已驳回' },
      WITHDRAWN: { color: 'default', text: '已撤回' },
    }
    return map[status.toUpperCase()] ?? { color: 'default', text: status }
  }

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!data) {
    return <Empty description="加载失败或申请不存在" />
  }

  const s = getStatusLabel(data.status)
  const showActions = data.status === 'SUBMITTED' || data.status === 'submitted'

  const openSupplementModal = () => {
    let comment = ''
    Modal.confirm({
      title: '要求补件',
      icon: <ExclamationCircleOutlined />,
      content: (
        <TextArea
          placeholder="请输入补件原因"
          rows={3}
          onChange={(e) => { comment = e.target.value }}
        />
      ),
      okText: '确认发送',
      cancelText: '取消',
      onOk: () => handleRequireSupplement(comment),
    })
  }

  const openRejectModal = () => {
    let comment = ''
    Modal.confirm({
      title: '确认驳回申请？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <TextArea
          placeholder="请输入驳回原因"
          rows={3}
          onChange={(e) => { comment = e.target.value }}
        />
      ),
      okText: '确认驳回',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => handleReject(comment),
    })
  }

  const openAcceptModal = () => {
    let comment = ''
    Modal.confirm({
      title: '确认受理申请？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <TextArea
          placeholder="请输入受理备注（选填）"
          rows={3}
          onChange={(e) => { comment = e.target.value }}
        />
      ),
      okText: '确认受理',
      cancelText: '取消',
      onOk: () => handleAccept(comment),
    })
  }

  const timelineItems = data.timeline?.map((ev) => ({
    color: ev.event.includes('提交') ? 'blue' : ev.event.includes('驳回') ? 'red' : ev.event.includes('补件') ? 'orange' : 'green',
    dot: ev.event.includes('驳回') ? <CloseCircleFilled /> : ev.event.includes('受理') ? <CheckCircleFilled /> : <ClockCircleFilled />,
    children: (
      <div>
        <div>{ev.event}</div>
        {ev.operator && <div style={{ color: '#888', fontSize: 12 }}>操作人: {ev.operator}</div>}
        {ev.comment && <div style={{ color: '#666', fontSize: 12 }}>{ev.comment}</div>}
        <div style={{ color: '#aaa', fontSize: 12 }}>{ev.createdAt}</div>
      </div>
    ),
  })) ?? []

  return (
    <div>
      <Card
        title="申请详情"
        extra={
          <Space>
            <Button onClick={() => navigate('/staff/todos')}>返回待办</Button>
            {showActions && (
              <>
                <Button onClick={openSupplementModal} loading={actionLoading}>
                  要求补件
                </Button>
                <Button danger onClick={openRejectModal} loading={actionLoading}>
                  驳回
                </Button>
                <Button type="primary" onClick={openAcceptModal} loading={actionLoading}>
                  受理
                </Button>
              </>
            )}
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="申请编号">{data.applicationNo || data.id}</Descriptions.Item>
          <Descriptions.Item label="用户ID">{data.userId}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={s.color}>{s.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="业务类型">{getBizTypeLabel(data.bizType)}</Descriptions.Item>
          <Descriptions.Item label="提交时间">{data.submittedAt || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{data.createdAt}</Descriptions.Item>
          <Descriptions.Item label="标题" span={2}>{data.title}</Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>{data.description || '-'}</Descriptions.Item>
          {data.supplementReason && (
            <Descriptions.Item label="补件原因" span={2}>
              <Tag color="orange">{data.supplementReason}</Tag>
            </Descriptions.Item>
          )}
          {data.reviewComment && (
            <Descriptions.Item label="审核意见" span={2}>
              <Tag color="blue">{data.reviewComment}</Tag>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {data.materials && data.materials.length > 0 && (
        <Card title="申请材料" style={{ marginTop: 16 }}>
          <List
            itemLayout="horizontal"
            dataSource={data.materials}
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
      )}

      {timelineItems.length > 0 && (
        <Card title="办理记录" style={{ marginTop: 16 }}>
          <Timeline items={timelineItems} />
        </Card>
      )}
    </div>
  )
}
