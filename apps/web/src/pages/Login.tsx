import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Tabs, message } from 'antd'
import { authApi } from '../api/services'
import { useAuthStore } from '../stores/auth'
import { useDeviceType } from '../hooks/useDeviceType'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const deviceType = useDeviceType()

  const defaultTab = deviceType === 'mobile' ? 'user' : 'staff'

  useEffect(() => {
    const savedTab = sessionStorage.getItem('loginTab')
    if (savedTab === 'user' || savedTab === 'staff') {
      // Allow restored tab preference
    }
  }, [])

  const handleTabChange = (key: string) => {
    sessionStorage.setItem('loginTab', key)
  }

  const handleLogin = async (values: { phone?: string; username?: string; password: string }, userType: 'user' | 'staff') => {
    setLoading(true)
    try {
      const loginData = userType === 'user' 
        ? { phone: values.phone, password: values.password }
        : { username: values.username, password: values.password }
      const res = await authApi.login(loginData)
      login(res.data.token, userType, res.data.userId, res.data.username)
      message.success('登录成功')
      navigate(userType === 'staff' ? '/staff/todos' : '/user/applications')
    } catch {
      message.error('登录失败，请检查账号密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '16px'
    }}>
      <Card 
        style={{ width: deviceType === 'mobile' ? '100%' : 400, maxWidth: 400 }} 
        styles={{ body: { padding: 0 } }}
        cover={
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px',
            textAlign: 'center',
            color: '#fff'
          }}>
            <h1 style={{ margin: 0, fontSize: 24, color: '#fff' }}>公证平台</h1>
            <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: 14 }}>
              {deviceType === 'mobile' ? '手机端 - 用户登录' : '电脑端 - 员工登录'}
            </p>
          </div>
        }
      >
        <Tabs
          defaultActiveKey={defaultTab}
          onChange={handleTabChange}
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
              label: '公证员登录',
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

function UserLoginForm({ loading, onLogin }: { loading: boolean; onLogin: (values: { phone: string; password: string }, userType: 'user' | 'staff') => void }) {
  const [form] = Form.useForm()

  return (
    <Form form={form} layout="vertical" onFinish={(values) => onLogin(values, 'user')}>
      <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入有效手机号' }]}>
        <Input placeholder="请输入手机号" maxLength={11} />
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
