import { useState } from 'react'
import { Card, Form, Input, Button, Result, Descriptions, Tag, message } from 'antd'
import { staffApi } from '../../api/services'
import type { Case } from '../../types'
import { CASE_STATUS_MAP } from '../../types'

interface VerifyResult {
  caseNo: string
  certificateNo: string
  bizType: string
  result: string
  acceptedAt: string
  completedAt: string
  status: string
  verifyCode: string
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
      const res = await staffApi.getCaseByVerifyCode(values.verifyCode)
      setResult(res.data)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const s = result ? (CASE_STATUS_MAP[result.status as keyof typeof CASE_STATUS_MAP] || { color: 'default', text: result.status }) : null

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <Card title="公证证书验真" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={handleVerify}>
          <Form.Item
            name="verifyCode"
            label="验真码"
            rules={[{ required: true, message: '请输入验真码' }]}
          >
            <Input placeholder="请输入证书验真码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              验真
            </Button>
          </Form.Item>
        </Form>
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
          <Descriptions column={2} bordered>
            <Descriptions.Item label="证书编号">{result.certificateNo}</Descriptions.Item>
            <Descriptions.Item label="验真码">{result.verifyCode}</Descriptions.Item>
            <Descriptions.Item label="业务类型">{result.bizType}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={s.color}>{s.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="受理时间">{result.acceptedAt}</Descriptions.Item>
            <Descriptions.Item label="完成时间">{result.completedAt}</Descriptions.Item>
            <Descriptions.Item label="公证内容" span={2}>{result.result}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  )
}
