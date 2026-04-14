import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Radio, message } from 'antd'
import { authApi } from '../api/services'
import { useAuthStore } from '../stores/auth'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState<'user' | 'staff'>('user')
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res = await authApi.login({ ...values })
      login(res.data.token, res.data.userType, res.data.userId, res.data.username)
      message.success('登录成功')
      navigate(res.data.userType === 'staff' ? '/staff/todos' : '/user/applications')
    } catch {
      message.error('用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card title="公证平台登录" style={{ width: 400 }}>
        <Radio.Group value={userType} onChange={(e) => setUserType(e.target.value)} style={{ marginBottom: 24 }}>
          <Radio.Button value="user">用户</Radio.Button>
          <Radio.Button value="staff">工作人员</Radio.Button>
        </Radio.Group>

        <Form layout="vertical" onFinish={onFinish} initialValues={{ username: '', password: '' }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
