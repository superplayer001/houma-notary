import { useState } from 'react'
import { Form, Input, Button, Card, message, useNavigate, Select, Space } from 'antd'
import { userApi } from '../../api/services'
import { BIZ_TYPE_OPTIONS } from '../../types'

const { TextArea } = Input

export default function UserApplicationNew() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const onFinish = async (values: { bizType: string; title: string; description: string }) => {
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
        <Form.Item name="bizType" label="业务类型" rules={[{ required: true }]}>
          <Select placeholder="请选择业务类型" options={BIZ_TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item name="title" label="申请标题" rules={[{ required: true }]}>
          <Input placeholder="请输入申请标题" maxLength={100} showCount />
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
