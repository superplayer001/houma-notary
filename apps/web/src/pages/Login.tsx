import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Tabs, message } from 'antd'
import { authApi } from '../api/services'
import { useAuthStore } from '../stores/auth'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleLogin = async (values: { username: string; password: string }, userType: 'user' | 'staff') => {
    setLoading(true)
    try {
      const res = await authApi.login({ ...values })
      login(res.data.token, userType, res.data.userId, res.data.username)
      message.success('登录成功')
      navigate(userType === 'staff' ? '/staff/todos' : '/user/applications')
    } catch {
      message.error('用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }} styles={{ body: { padding: 0 } }}>
        <Tabs
          defaultActiveKey="user"
          items={[
            {
              key: 'user',
              label: '用户登录',
              children: (
                <div style={{ padding: '24px 24px 0' }}>
                  <UserLoginForm loading={loading} onLogin={handleLogin} />
                </div>
              ),
            },
            {
              key: 'staff',
              label: '员工登录',
              children: (
                <div style={{ padding: '24px 24px 0' }}>
                  <StaffLoginForm loading={loading} onLogin={handleLogin} />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

function UserLoginForm({ loading, onLogin }: { loading: boolean; onLogin: (values: { username: string; password: string }, userType: 'user' | 'staff') => void }) {
  const [form] = Form.useForm()

  return (
    <Form form={form} layout="vertical" onFinish={(values) => onLogin(values, 'user')}>
      <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
        <Input placeholder="请输入用户名" />
      </Form.Item>
      <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password placeholder="请输入密码" />
      </Form.Item>
      <Form.Item style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit" loading={loading} block>
          登录
        </Button>
      </Form.Item>
    </Form>
  )
}

function StaffLoginForm({ loading, onLogin }: { loading: boolean; onLogin: (values: { username: string; password: string }, userType: 'user' | 'staff') => void }) {
  const [form] = Form.useForm()

  return (
    <Form form={form} layout="vertical" onFinish={(values) => onLogin(values, 'staff')}>
      <Form.Item name="username" label="工号" rules={[{ required: true, message: '请输入工号' }]}>
        <Input placeholder="请输入工号" />
      </Form.Item>
      <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password placeholder="请输入密码" />
      </Form.Item>
      <Form.Item style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit" loading={loading} block>
          登录
        </Button>
      </Form.Item>
    </Form>
  )
}
