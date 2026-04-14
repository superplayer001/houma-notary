import { useState } from 'react'
import { Form, Input, Button, Card, message, useNavigate, Select, Space } from 'antd'
import { createApplication } from '../../services/api/applications'
import { isMockMode } from '../../services/request'
import { mockCreateApplication } from '../../services/mock'
import { BIZ_TYPE_OPTIONS } from '../../types'
import type { Application } from '../../types'

const { TextArea } = Input

export default function UserApplicationNew() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const onFinish = async (values: { bizType: string; title: string; description: string }) => {
    setLoading(true)
    try {
      let app: Application
      if (isMockMode()) {
        await new Promise(r => setTimeout(r, 300))
        app = mockCreateApplication({ bizType: values.bizType as Application['bizType'], title: values.title, description: values.description })
      } else {
        app = await createApplication({
          biz_type: values.bizType as 'ENFORCEMENT' | 'DEPOSIT',
          title: values.title,
        })
      }
      message.success('创建成功')
      navigate(`/user/applications/${app.id}`)
    } catch {
      message.error('创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="新建申请">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="bizType" label="业务类型" rules={[{ required: true, message: '请选择业务类型' }]}>
          <Select placeholder="请选择业务类型" options={BIZ_TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item name="title" label="申请标题" rules={[{ required: true, message: '请输入申请标题' }]}>
          <Input placeholder="请输入申请标题" maxLength={100} showCount />
        </Form.Item>
        <Form.Item name="description" label="描述（可选）">
          <TextArea rows={4} placeholder="请详细描述您的公证需求（可不填）" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              提交
            </Button>
            <Button onClick={() => navigate('/user/applications')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
