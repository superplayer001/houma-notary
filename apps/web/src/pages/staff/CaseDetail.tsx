import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, Input, message, Timeline, Alert, Modal, Spin, Empty, Select } from 'antd'
import { CheckCircleFilled, ClockCircleFilled, ExclamationCircleOutlined, CloseCircleFilled, FileTextOutlined } from '@ant-design/icons'
import { useCaseDetail } from '../../hooks/useCaseDetail'
import { BIZ_TYPE_OPTIONS } from '../../types'
import type { TimelineEvent } from '../../services/adapters/caseAdapter'
import type { Material } from '../../types'

const { TextArea } = Input
const { Option } = Select

const CASE_STATUS_MAP: Record<string, { color: string; text: string }> = {
  CREATED: { color: 'default', text: '已创建' },
  ASSIGNED: { color: 'blue', text: '已分配' },
  UNDER_REVIEW: { color: 'processing', text: '审查中' },
  WAITING_VIDEO: { color: 'purple', text: '待视频' },
  WAITING_SIGN: { color: 'cyan', text: '待签署' },
  WAITING_APPROVAL: { color: 'orange', text: '待审批' },
  APPROVED: { color: 'green', text: '已批准' },
  ISSUED: { color: 'green', text: '已出证' },
  COMPLETED: { color: 'green', text: '已完成' },
  VOIDED: { color: 'red', text: '已作废' },
  CLOSED: { color: 'default', text: '已关闭' },
  assigned: { color: 'blue', text: '已分配' },
  in_progress: { color: 'orange', text: '进行中' },
  completed: { color: 'green', text: '已完成' },
  voided: { color: 'red', text: '已作废' },
}

const CERT_STATUS_MAP: Record<string, { color: string; text: string }> = {
  ISSUED: { color: 'green', text: '有效' },
  VOIDED: { color: 'red', text: '已作废' },
  issued: { color: 'green', text: '有效' },
  voided: { color: 'red', text: '已作废' },
}

const NEXT_STATUS_OPTIONS: Record<string, { value: string; label: string }[]> = {
  CREATED: [{ value: 'UNDER_REVIEW', label: '进入审查' }],
  UNDER_REVIEW: [{ value: 'WAITING_VIDEO', label: '待视频' }],
  WAITING_VIDEO: [{ value: 'WAITING_SIGN', label: '待签署' }],
  WAITING_SIGN: [{ value: 'WAITING_APPROVAL', label: '待审批' }],
  WAITING_APPROVAL: [{ value: 'APPROVED', label: '批准' }],
}

const getBizTypeLabel = (value: string) => {
  const option = BIZ_TYPE_OPTIONS.find(opt => opt.value === value)
  return option ? option.label : value
}

const canAdvance = (status: string) => {
  return NEXT_STATUS_OPTIONS[status] !== undefined
}

const isVoidable = (status: string) => {
  return !['ISSUED', 'COMPLETED', 'VOIDED', 'CLOSED', 'assigned', 'completed', 'voided'].includes(status)
}

export default function StaffCaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    data,
    loading,
    actionLoading,
    fetch,
    handleAdvanceStatus,
    handleIssue,
    handleVoidCase,
    handleVoidCertificate,
  } = useCaseDetail(id ?? '')

  useEffect(() => { fetch() }, [id])

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!data) {
    return <Empty description="加载失败或案件不存在" />
  }

  const caseStatus = data.status
  const certStatus = data.certificateStatus
  const cs = CASE_STATUS_MAP[caseStatus] ?? { color: 'default', text: caseStatus }
  const certS = certStatus ? (CERT_STATUS_MAP[certStatus] ?? { color: 'default', text: certStatus }) : null

  const timelineItems = data.timeline?.map((ev: TimelineEvent) => {
    const isReject = ev.event.includes('驳回') || ev.event.includes('作废')
    const isAccept = ev.event.includes('受理') || ev.event.includes('批准')
    return {
      color: isReject ? 'red' : isAccept ? 'green' : 'blue',
      dot: isReject ? <CloseCircleFilled /> : isAccept ? <CheckCircleFilled /> : <ClockCircleFilled />,
      children: (
        <div>
          <div>{ev.event}</div>
          {ev.operator && <div style={{ color: '#888', fontSize: 12 }}>操作人: {ev.operator}</div>}
          {ev.comment && <div style={{ color: '#666', fontSize: 12 }}>{ev.comment}</div>}
          <div style={{ color: '#aaa', fontSize: 12 }}>{ev.createdAt}</div>
        </div>
      ),
    }
  }) ?? []

  const openAdvanceModal = () => {
    let toStatus = ''
    let comment = ''
    Modal.confirm({
      title: '推进案件状态',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Select
              placeholder="选择下一状态"
              style={{ width: '100%' }}
              onChange={(v) => { toStatus = v }}
            >
              {(NEXT_STATUS_OPTIONS[caseStatus] ?? []).map((opt) => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </div>
          <TextArea
            placeholder="备注（选填）"
            rows={3}
            onChange={(e) => { comment = e.target.value }}
          />
        </div>
      ),
      okText: '确认推进',
      cancelText: '取消',
      onOk: () => {
        if (!toStatus) { message.warning('请选择状态'); return }
        handleAdvanceStatus(toStatus, comment)
      },
    })
  }

  const openIssueModal = () => {
    let comment = ''
    Modal.confirm({
      title: '确认出证',
      icon: <ExclamationCircleOutlined />,
      content: (
        <TextArea
          placeholder="出证备注（选填）"
          rows={3}
          onChange={(e) => { comment = e.target.value }}
        />
      ),
      okText: '确认出证',
      cancelText: '取消',
      onOk: () => handleIssue(comment),
    })
  }

  const openVoidCaseModal = () => {
    let comment = ''
    Modal.confirm({
      title: '确认作废此案件？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <TextArea
          placeholder="请输入作废原因"
          rows={3}
          onChange={(e) => { comment = e.target.value }}
        />
      ),
      okText: '确认作废',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        if (!comment.trim()) { message.warning('请输入作废原因'); return }
        handleVoidCase(comment)
      },
    })
  }

  const openVoidCertModal = () => {
    if (!data.certificate?.id) return
    let comment = ''
    Modal.confirm({
      title: '确认作废此证书？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <TextArea
          placeholder="请输入作废原因"
          rows={3}
          onChange={(e) => { comment = e.target.value }}
        />
      ),
      okText: '确认作废',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        if (!comment.trim()) { message.warning('请输入作废原因'); return }
        handleVoidCertificate(data.certificate?.id ?? '', comment)
      },
    })
  }

  return (
    <div>
      <Card
        title="案件详情"
        extra={
          <Space>
            {canAdvance(caseStatus) && (
              <Button onClick={openAdvanceModal} loading={actionLoading}>
                状态推进
              </Button>
            )}
            {caseStatus === 'APPROVED' && (
              <Button type="primary" onClick={openIssueModal} loading={actionLoading}>
                出证
              </Button>
            )}
            {isVoidable(caseStatus) && (
              <Button danger onClick={openVoidCaseModal} loading={actionLoading}>
                作废案件
              </Button>
            )}
            <Button onClick={() => navigate('/staff/cases')}>返回列表</Button>
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="案件ID">{data.id}</Descriptions.Item>
          <Descriptions.Item label="案件编号">{data.caseNo || '-'}</Descriptions.Item>
          <Descriptions.Item label="申请ID">{data.applicationId}</Descriptions.Item>
          <Descriptions.Item label="处理人">{data.staffId || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={cs.color}>{cs.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="业务类型">{getBizTypeLabel(data.bizType)}</Descriptions.Item>
          <Descriptions.Item label="受理时间">{data.acceptedAt || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{data.createdAt}</Descriptions.Item>
        </Descriptions>
      </Card>

      {data.application && (
        <Card title="申请信息" style={{ marginTop: 16 }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="申请编号">{data.application.applicationNo || data.applicationId}</Descriptions.Item>
            <Descriptions.Item label="用户ID">{data.application.userId}</Descriptions.Item>
            <Descriptions.Item label="业务类型">{getBizTypeLabel(data.application.bizType)}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{data.application.createdAt}</Descriptions.Item>
            <Descriptions.Item label="标题" span={2}>{data.application.title}</Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>{data.application.description || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {timelineItems.length > 0 && (
        <Card title="办理记录" style={{ marginTop: 16 }}>
          <Timeline items={timelineItems} />
        </Card>
      )}

      <Card title="公证证书" style={{ marginTop: 16 }}>
        <Alert
          message="证书信息"
          type={certStatus === 'VOIDED' || certStatus === 'voided' ? 'error' : 'info'}
          showIcon
          icon={certStatus === 'VOIDED' || certStatus === 'voided' ? <CloseCircleFilled /> : <FileTextOutlined />}
          description={
            <>
              <Descriptions column={2} bordered size="small" style={{ marginTop: 12 }}>
                <Descriptions.Item label="证书编号">{data.certificateNo || data.certificate?.certificateNo || '待生成'}</Descriptions.Item>
                <Descriptions.Item label="验真码">{data.verifyCode || data.certificate?.verifyCode || '待生成'}</Descriptions.Item>
                <Descriptions.Item label="证书状态">
                  {certS ? <Tag color={certS.color}>{certS.text}</Tag> : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="出证时间">{data.issuedAt || data.certificate?.issuedAt || '-'}</Descriptions.Item>
                {(certStatus === 'VOIDED' || certStatus === 'voided') && (
                  <>
                    <Descriptions.Item label="作废时间">{data.voidedAt || data.certificate?.voidedAt || '-'}</Descriptions.Item>
                    <Descriptions.Item label="作废原因" span={2}>
                      <Tag color="red">{data.voidReason || data.certificate?.voidReason || '-'}</Tag>
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>
              {(certStatus === 'VOIDED' || certStatus === 'voided') && (
                <Alert message="此证书已被作废，不再有效" type="error" showIcon style={{ marginTop: 12 }} />
              )}
              {(certStatus === 'ISSUED' || certStatus === 'issued') && (
                <Space style={{ marginTop: 12 }}>
                  <Button danger size="small" onClick={openVoidCertModal} loading={actionLoading}>
                    证书作废
                  </Button>
                </Space>
              )}
            </>
          }
        />
      </Card>

      {data.materials && data.materials.length > 0 && (
        <Card title="申请材料" style={{ marginTop: 16 }}>
          <Descriptions column={2} bordered size="small">
            {data.materials.map((m: Material) => (
              <Descriptions.Item key={m.id} label={m.name}>
                <a href={m.url} target="_blank" rel="noopener noreferrer">{m.name}</a>
                <span style={{ color: '#888', marginLeft: 8 }}>{m.type}</span>
              </Descriptions.Item>
            ))}
          </Descriptions>
        </Card>
      )}
    </div>
  )
}
