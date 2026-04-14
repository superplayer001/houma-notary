import { useState } from 'react'
import { Card, Form, Input, Button, Result, Descriptions, Tag, Spin, Alert } from 'antd'
import { verifyCertificate, type VerifyResult } from '../services/api/verify'

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  ISSUED: { color: 'green', text: '有效' },
  VOIDED: { color: 'red', text: '已作废' },
  issued: { color: 'green', text: '有效' },
  voided: { color: 'red', text: '已作废' },
}

export default function Verify() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [form] = Form.useForm()

  const handleVerify = async (values: { verifyCode: string }) => {
    setLoading(true)
    setNotFound(false)
    setResult(null)
    try {
      const res = await verifyCertificate(values.verifyCode)
      setResult(res)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const s = result?.status ? (STATUS_MAP[result.status] ?? { color: 'default', text: result.status }) : null

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <Card title="公证证书验真" style={{ marginBottom: 24 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
          </div>
        )}
        {!loading && (
          <Form form={form} layout="vertical" onFinish={handleVerify}>
            <Form.Item
              name="verifyCode"
              label="验真码"
              rules={[{ required: true, message: '请输入验真码' }]}
            >
              <Input placeholder="请输入证书验真码" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                验真
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>

      {notFound && (
        <Card>
          <Result
            status="warning"
            title="未找到相关证书"
            subTitle="请检查验真码是否正确"
          />
        </Card>
      )}

      {result && s && (
        <Card title="证书信息">
          <Alert
            message={s.text === '有效' ? '证书有效' : '证书已作废'}
            type={s.text === '有效' ? 'success' : 'error'}
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Descriptions column={2} bordered>
            <Descriptions.Item label="证书编号">{result.certificateNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="验真码">{result.verifyCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="案件编号">{result.caseNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="证书状态">
              <Tag color={s.color}>{s.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="业务类型">{result.bizType || '-'}</Descriptions.Item>
            <Descriptions.Item label="受理时间">{result.acceptedAt || '-'}</Descriptions.Item>
            <Descriptions.Item label="出证时间">{result.issuedAt || '-'}</Descriptions.Item>
            {result.voidedAt && (
              <Descriptions.Item label="作废时间">{result.voidedAt}</Descriptions.Item>
            )}
            {result.voidReason && (
              <Descriptions.Item label="作废原因" span={2}>
                <Tag color="red">{result.voidReason}</Tag>
              </Descriptions.Item>
            )}
            {result.result && (
              <Descriptions.Item label="公证内容" span={2}>{result.result}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}
    </div>
  )
}
