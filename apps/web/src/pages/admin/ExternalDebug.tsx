import { useState } from 'react'
import { Card, Form, Input, Button, Space, Table, Tag, message, Alert, Tabs, Descriptions } from 'antd'
import { SendOutlined, SearchOutlined } from '@ant-design/icons'
import { externalApi } from '../../api/services'

const { TextArea } = Input

interface QueryResult {
  requestNo: string
  stage: string
  status: string
  result?: string
  createdAt?: string
}

interface SendResult {
  requestNo: string
  stage: string
  status: string
  createdAt: string
}

export default function ExternalDebug() {
  const [loading, setLoading] = useState(false)
  const [queryNo, setQueryNo] = useState('')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [sendData, setSendData] = useState('')
  const [sendResult, setSendResult] = useState<SendResult | null>(null)
  const [form] = Form.useForm()

  const handleSend = async (values: { requestNo?: string; stage?: string; requestData?: string }) => {
    setLoading(true)
    try {
      const res = await externalApi.sendRequest({
        requestNo: values.requestNo,
        stage: values.stage,
        requestData: values.requestData,
      })
      setSendResult(res.data)
      message.success('请求已发送')
    } catch {
      message.error('发送失败')
    } finally {
      setLoading(false)
    }
  }

  const handleQuery = async () => {
    if (!queryNo.trim()) { message.warning('请输入请求编号'); return }
    setLoading(true)
    try {
      const res = await externalApi.queryRequest(queryNo)
      setQueryResult(res.data)
    } catch {
      message.error('查询失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Tabs
        items={[
          {
            key: 'send',
            label: '发送请求',
            children: (
              <Card title="发送外部请求">
                <Form form={form} layout="vertical" onFinish={handleSend}>
                  <Form.Item name="requestNo" label="请求编号（可选）">
                    <Input placeholder="自动生成" />
                  </Form.Item>
                  <Form.Item name="stage" label="业务阶段">
                    <Input placeholder="如：SUBMIT, QUERY, NOTIFY" />
                  </Form.Item>
                  <Form.Item name="requestData" label="请求数据（JSON）">
                    <TextArea rows={6} placeholder={'{\n  "bizType": "ENFORCEMENT",\n  "amount": 100000\n}'} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" icon={<SendOutlined />} htmlType="submit" loading={loading}>
                      发送请求
                    </Button>
                  </Form.Item>
                </Form>
                {sendResult && (
                  <Alert
                    message="请求已发送"
                    type="success"
                    showIcon
                    style={{ marginTop: 16 }}
                    description={
                      <Descriptions column={2} size="small" style={{ marginTop: 8 }}>
                        <Descriptions.Item label="请求编号">{sendResult.requestNo}</Descriptions.Item>
                        <Descriptions.Item label="阶段">{sendResult.stage}</Descriptions.Item>
                        <Descriptions.Item label="状态">{sendResult.status}</Descriptions.Item>
                        <Descriptions.Item label="时间">{sendResult.createdAt}</Descriptions.Item>
                      </Descriptions>
                    }
                  />
                )}
              </Card>
            ),
          },
          {
            key: 'query',
            label: '查询结果',
            children: (
              <Card title="查询请求状态">
                <Space style={{ marginBottom: 16 }}>
                  <Input placeholder="请输入请求编号" value={queryNo} onChange={(e) => setQueryNo(e.target.value)} style={{ width: 300 }} />
                  <Button icon={<SearchOutlined />} onClick={handleQuery} loading={loading}>查询</Button>
                </Space>
                {queryResult && (
                  <Alert
                    message={`状态：${queryResult.status}`}
                    type={queryResult.stage === 'COMPLETED' ? 'success' : 'info'}
                    showIcon
                    description={
                      <Descriptions column={2} size="small" style={{ marginTop: 8 }}>
                        <Descriptions.Item label="请求编号">{queryResult.requestNo}</Descriptions.Item>
                        <Descriptions.Item label="阶段">{queryResult.stage}</Descriptions.Item>
                        <Descriptions.Item label="状态">{queryResult.status}</Descriptions.Item>
                        {queryResult.result && <Descriptions.Item label="结果" span={2}>{queryResult.result}</Descriptions.Item>}
                        {queryResult.createdAt && <Descriptions.Item label="时间">{queryResult.createdAt}</Descriptions.Item>}
                      </Descriptions>
                    }
                  />
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  )
}
