import { useState } from 'react'
import { Card, Form, Input, Button, Space, Alert, Tabs, Descriptions, Spin, Empty, Divider } from 'antd'
import { SendOutlined, SearchOutlined } from '@ant-design/icons'
import { useExternalRequest } from '../../hooks/useExternalRequest'

const { TextArea } = Input

export default function ExternalDebug() {
  const [sourceSystem, setSourceSystem] = useState('LOAN_SYSTEM')
  const [querySourceSystem, setQuerySourceSystem] = useState('LOAN_SYSTEM')
  const [form] = Form.useForm()
  const { sendLoading, queryLoading, sendResult, queryResult, handleSend, handleQuery } = useExternalRequest()

  const onSend = async (values: { title: string; applicantName: string; applicantIdNo: string; remark?: string; externalRequestNo?: string }) => {
    await handleSend({
      sourceSystem,
      title: values.title,
      applicantName: values.applicantName,
      applicantIdNo: values.applicantIdNo,
      remark: values.remark,
      externalRequestNo: values.externalRequestNo,
    })
  }

  const onQuery = async () => {
    const requestNo = (document.getElementById('queryRequestNo') as HTMLInputElement)?.value
    if (!requestNo?.trim()) return
    await handleQuery(requestNo, querySourceSystem)
  }

  const certResult = queryResult?.certificate

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Tabs
        items={[
          {
            key: 'send',
            label: '发送外部附强请求',
            children: (
              <Card title="发送外部附强请求">
                <Form form={form} layout="vertical" onFinish={onSend}>
                  <Form.Item name="sourceSystem" label="来源系统（X-Source-System）" rules={[{ required: true }]}>
                    <Input value={sourceSystem} onChange={e => setSourceSystem(e.target.value)} placeholder="如：LOAN_SYSTEM" />
                  </Form.Item>
                  <Form.Item name="externalRequestNo" label="外部请求编号（可选）">
                    <Input placeholder="自动生成" />
                  </Form.Item>
                  <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
                    <Input placeholder="如：某借款合同附强申请" />
                  </Form.Item>
                  <Form.Item name="applicantName" label="申请人姓名" rules={[{ required: true, message: '请输入申请人姓名' }]}>
                    <Input placeholder="如：张三" />
                  </Form.Item>
                  <Form.Item name="applicantIdNo" label="申请人身份证号" rules={[{ required: true, message: '请输入身份证号' }]}>
                    <Input placeholder="如：140xxxxxxxxxxxxx" />
                  </Form.Item>
                  <Form.Item name="remark" label="备注">
                    <TextArea rows={3} placeholder="外部系统推送的附强申请备注" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" icon={<SendOutlined />} htmlType="submit" loading={sendLoading}>
                      发送请求
                    </Button>
                  </Form.Item>
                </Form>
                {sendLoading && <Spin tip="发送中..." />}
                {sendResult && (
                  <Alert
                    message="请求已发送"
                    type="success"
                    showIcon
                    style={{ marginTop: 16 }}
                    description={
                      <Descriptions column={2} size="small" style={{ marginTop: 8 }}>
                        <Descriptions.Item label="请求编号">{sendResult.requestNo}</Descriptions.Item>
                        <Descriptions.Item label="状态">处理中</Descriptions.Item>
                      </Descriptions>
                    }
                  />
                )}
              </Card>
            ),
          },
          {
            key: 'query',
            label: '查询外部附强结果',
            children: (
              <Card title="查询外部附强请求状态">
                <Space style={{ marginBottom: 16 }}>
                  <Input
                    id="querySourceSystem"
                    placeholder="来源系统"
                    value={querySourceSystem}
                    onChange={e => setQuerySourceSystem(e.target.value)}
                    style={{ width: 200 }}
                  />
                  <Input
                    id="queryRequestNo"
                    placeholder="请输入请求编号"
                    style={{ width: 300 }}
                  />
                  <Button icon={<SearchOutlined />} onClick={onQuery} loading={queryLoading}>查询</Button>
                </Space>
                {queryLoading && <Spin tip="查询中..." />}
                {queryResult && (
                  <>
                    <Alert
                      message={`状态：${queryResult.status}`}
                      type={queryResult.status === 'COMPLETED' ? 'success' : 'info'}
                      showIcon
                      style={{ marginBottom: 16 }}
                      description={
                        <Descriptions column={2} size="small" style={{ marginTop: 8 }}>
                          <Descriptions.Item label="请求编号">{queryResult.requestNo}</Descriptions.Item>
                          <Descriptions.Item label="外部请求编号">{queryResult.externalRequestNo}</Descriptions.Item>
                          <Descriptions.Item label="来源系统">{queryResult.sourceSystem}</Descriptions.Item>
                          <Descriptions.Item label="业务类型">{queryResult.bizType}</Descriptions.Item>
                          <Descriptions.Item label="当前阶段">{queryResult.currentStage}</Descriptions.Item>
                          <Descriptions.Item label="状态">{queryResult.status}</Descriptions.Item>
                        </Descriptions>
                      }
                    />
                    {queryResult.application && (
                      <>
                        <Divider orientation="left">申请信息</Divider>
                        <Descriptions column={2} size="small">
                          <Descriptions.Item label="申请ID">{queryResult.application.id}</Descriptions.Item>
                          <Descriptions.Item label="申请编号">{queryResult.application.applicationNo}</Descriptions.Item>
                          <Descriptions.Item label="申请人">{queryResult.application.applicantName}</Descriptions.Item>
                          <Descriptions.Item label="业务类型">{queryResult.application.bizType}</Descriptions.Item>
                        </Descriptions>
                      </>
                    )}
                    {queryResult.case && (
                      <>
                        <Divider orientation="left">案件信息</Divider>
                        <Descriptions column={2} size="small">
                          <Descriptions.Item label="案件ID">{queryResult.case.id}</Descriptions.Item>
                          <Descriptions.Item label="案件编号">{queryResult.case.caseNo}</Descriptions.Item>
                          <Descriptions.Item label="案件状态">{queryResult.case.status}</Descriptions.Item>
                          <Descriptions.Item label="案件结果">{queryResult.case.result}</Descriptions.Item>
                        </Descriptions>
                      </>
                    )}
                    {certResult && (
                      <>
                        <Divider orientation="left">证书信息</Divider>
                        <Descriptions column={2} size="small">
                          <Descriptions.Item label="证书编号">{certResult.certificateNo}</Descriptions.Item>
                          <Descriptions.Item label="验证码">{certResult.verifyCode}</Descriptions.Item>
                          <Descriptions.Item label="查验地址">{certResult.verifyUrl}</Descriptions.Item>
                          <Descriptions.Item label="签发时间">{certResult.issuedAt}</Descriptions.Item>
                          {certResult.digest && <Descriptions.Item label="摘要" span={2}>{certResult.digest}</Descriptions.Item>}
                        </Descriptions>
                      </>
                    )}
                  </>
                )}
                {!queryLoading && !queryResult && (
                  <Empty description="请输入请求编号并点击查询" />
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  )
}
