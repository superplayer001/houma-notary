import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, List, Input, message, Alert, Modal, Result, Select } from 'antd'
import { VideoCameraOutlined, UserOutlined, AimOutlined, StopOutlined, CheckCircleOutlined, AudioOutlined } from '@ant-design/icons'
import { videoApi } from '../api/services'

const { TextArea } = Input

const MOCK_CASES = [
  { id: 'CASE-001', title: '遗嘱公证 - APP-002' },
  { id: 'CASE-002', title: '强制执行公证 - APP-003' },
  { id: 'CASE-003', title: '房产继承公证 - APP-001' },
]

const STATUS_CONFIG: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  waiting: { color: 'orange', text: '等待开始', icon: <AimOutlined /> },
  in_progress: { color: 'blue', text: '进行中', icon: <VideoCameraOutlined /> },
  completed: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
  aborted: { color: 'red', text: '已中止', icon: <StopOutlined /> },
}

export default function VideoSession() {
  const navigate = useNavigate()
  const [caseId, setCaseId] = useState<string>('')
  const [session, setSession] = useState<{
    id: string
    caseId: string
    roomId: string
    status: string
    participants: string[]
    startedAt?: string
    completedAt?: string
    recordingUrl?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [abortReason, setAbortReason] = useState('')

  const handleFetch = async () => {
    if (!caseId) { message.warning('请先选择案件'); return }
    setLoading(true)
    try {
      const res = await videoApi.getSession(caseId)
      setSession(res.data)
    } catch {
      message.error('获取会话失败，请确认案件已分配双录任务')
      setSession({
        id: `VID-${Date.now()}`,
        caseId,
        roomId: `ROOM-${Date.now()}`,
        status: 'waiting',
        participants: ['公证员01', '申请人'],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async () => {
    if (!caseId) return
    setLoading(true)
    try {
      const res = await videoApi.startSession(caseId)
      setSession(res.data)
      message.success('双录已开始')
    } catch {
      message.error('启动失败')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!caseId) return
    setLoading(true)
    try {
      const res = await videoApi.completeSession(caseId)
      setSession({ ...res.data, recordingUrl: 'https://example.com/recording/mock.mp4' })
      message.success('双录已完成')
    } catch {
      message.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAbort = () => {
    Modal.confirm({
      title: '确认中止双录？',
      content: <TextArea rows={2} placeholder="请输入中止原因" onChange={(e) => setAbortReason(e.target.value)} />,
      okText: '确认中止',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        if (!caseId) return
        setLoading(true)
        try {
          await videoApi.abortSession(caseId, abortReason)
          setSession((prev) => prev ? { ...prev, status: 'aborted' } : null)
          message.success('双录已中止')
        } catch {
          message.error('操作失败')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const statusCfg = session ? STATUS_CONFIG[session.status] || STATUS_CONFIG.waiting : null

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
      <Card title="双录会话管理" extra={<Button onClick={() => navigate('/staff/cases')}>返回案件列表</Button>}>
        <Space style={{ marginBottom: 16 }} direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Select
              placeholder="请选择案件"
              value={caseId || undefined}
              onChange={(v) => { setCaseId(v); setSession(null) }}
              style={{ width: 300 }}
              options={MOCK_CASES.map(c => ({ label: c.title, value: c.id }))}
            />
            <Button type="primary" onClick={handleFetch} loading={loading}>查询会话</Button>
          </Space>
        </Space>

        {session && statusCfg && (
          <>
            <Alert
              message={`双录状态：${statusCfg.text}`}
              type={session.status === 'completed' ? 'success' : session.status === 'aborted' ? 'error' : 'info'}
              icon={statusCfg.icon}
              style={{ marginBottom: 16 }}
            />

            <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="会话ID">{session.id}</Descriptions.Item>
              <Descriptions.Item label="案件ID">{session.caseId}</Descriptions.Item>
              <Descriptions.Item label="房间号">{session.roomId}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusCfg.color}>{statusCfg.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">{session.startedAt || '-'}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{session.completedAt || '-'}</Descriptions.Item>
            </Descriptions>

            <Card title="参与人" style={{ marginBottom: 16 }}>
              <List
                size="small"
                dataSource={session.participants}
                renderItem={(p) => (
                  <List.Item>
                    <List.Item.Meta avatar={<UserOutlined />} title={p} />
                  </List.Item>
                )}
              />
            </Card>

            {session.status === 'waiting' && (
              <Card title="入会信息" style={{ marginBottom: 16 }}>
                <Alert
                  message="请使用以下信息加入双录会议室"
                  description={
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="房间号"><strong>{session.roomId}</strong></Descriptions.Item>
                      <Descriptions.Item label="入会方式">联系管理员获取会议室链接或使用会议室号加入</Descriptions.Item>
                    </Descriptions>
                  }
                  type="info"
                  showIcon
                />
              </Card>
            )}

            {session.status === 'in_progress' && (
              <Card title="双录制进行中" style={{ marginBottom: 16 }}>
                <Result
                  status="info"
                  icon={<VideoCameraOutlined style={{ fontSize: 48, color: '#1890ff' }} />}
                  title="双录制正在进行中"
                  subTitle="请确保摄像头和麦克风正常工作，全程录制将保存"
                />
                <Space style={{ width: '100%', justifyContent: 'center' }}>
                  <Button danger icon={<StopOutlined />} onClick={handleAbort} loading={loading}>
                    中止双录
                  </Button>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleComplete} loading={loading}>
                    完成双录
                  </Button>
                </Space>
              </Card>
            )}

            {session.status === 'completed' && (
              <Card title="录制结果" style={{ marginBottom: 16 }}>
                <Result
                  status="success"
                  icon={<AudioOutlined />}
                  title="双录已完成"
                  subTitle="录制文件已保存，可联系管理员获取录制链接"
                />
                {session.recordingUrl && (
                  <Alert message="录制文件" description={<a href={session.recordingUrl} target="_blank" rel="noopener noreferrer">{session.recordingUrl}</a>} type="success" showIcon />
                )}
              </Card>
            )}

            {session.status === 'aborted' && (
              <Card title="双录已中止" style={{ marginBottom: 16 }}>
                <Result
                  status="error"
                  icon={<StopOutlined />}
                  title="双录已被中止"
                  subTitle="如需继续，请重新发起双录会话"
                />
              </Card>
            )}

            <Space style={{ width: '100%', justifyContent: 'center' }}>
              {session.status === 'waiting' && (
                <Button type="primary" size="large" icon={<VideoCameraOutlined />} onClick={handleStart} loading={loading}>
                  开始双录
                </Button>
              )}
              {(session.status === 'completed' || session.status === 'aborted') && (
                <Button onClick={() => { setSession(null); setCaseId('') }}>选择其他案件</Button>
              )}
            </Space>
          </>
        )}
      </Card>
    </div>
  )
}
