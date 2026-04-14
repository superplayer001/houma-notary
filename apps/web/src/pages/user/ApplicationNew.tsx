import { useState } from 'react'
import { Form, Input, Button, Card, message, useNavigate } from 'antd'
import { userApi } from '../../api/services'

const { TextArea } = Input

export default function UserApplicationNew() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const onFinish = async (values: { type: string; description: string }) => {
    setLoading(true)
    try {
      const res = await userApi.createApplication(values)
      message.success('创建成功')
      navigate(`/user/applications/${res.data.id}`)
    } catch {
      message.error('创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="新建申请">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="type" label="申请类型" rules={[{ required: true }]}>
          <Input placeholder="如：房产公证、遗嘱公证等" />
        </Form.Item>
        <Form.Item name="description" label="描述" rules={[{ required: true }]}>
          <TextArea rows={4} placeholder="请详细描述您的公证需求" />
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
