import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Tabs, message } from 'antd'
import { loginUser, loginStaff, loginAdmin } from '../services/api/auth'
import { useAuthStore } from '../stores/auth'
import { useDeviceType } from '../hooks/useDeviceType'
import { isMockMode } from '../services/request'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const deviceType = useDeviceType()

  const defaultTab = deviceType === 'mobile' ? 'user' : 'staff'

  useEffect(() => {
    const savedTab = sessionStorage.getItem('loginTab')
    if (savedTab === 'user' || savedTab === 'staff' || savedTab === 'admin') {
      // allow restored preference
    }
  }, [])

  const handleTabChange = (key: string) => {
    sessionStorage.setItem('loginTab', key)
  }

  const handleLogin = async (
    values: { username: string; password: string },
    userType: 'user' | 'staff' | 'admin'
  ) => {
    setLoading(true)
    try {
      if (isMockMode()) {
        const mockUserType = userType === 'user' ? 'user' : userType === 'admin' ? 'admin' : 'staff'
        login('mock-token-' + Date.now(), mockUserType, 'S001', userType === 'user' ? '测试用户' : '公证员')
        message.success('登录成功（Mock）')
        navigate(userType === 'user' ? '/user/applications' : '/staff/todos')
        return
      }

      let res
      if (userType === 'user') {
        res = await loginUser({ username: values.username, password: values.password })
        login(res.token, res.userType, res.userId, res.username)
        navigate('/user/applications')
      } else if (userType === 'staff') {
        res = await loginStaff({ username: values.username, password: values.password })
        login(res.token, res.userType, res.userId, res.username)
        navigate('/staff/todos')
      } else {
        res = await loginAdmin({ username: values.username, password: values.password })
        login(res.token, res.userType, res.userId, res.username)
        navigate('/staff/todos')
      }
      message.success('登录成功')
    } catch {
      message.error('登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px',
      }}
    >
      <Card
        style={{ width: deviceType === 'mobile' ? '100%' : 400, maxWidth: 400 }}
        styles={{ body: { padding: 0 } }}
        cover={
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '24px',
              textAlign: 'center',
              color: '#fff',
            }}
          >
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
                  <StaffLoginForm loading={loading} onLogin={handleLogin} userType="staff" />
                </div>
              ),
            },
            {
              key: 'admin',
              label: '管理员登录',
              children: (
                <div style={{ padding: '24px 24px 0' }}>
                  <StaffLoginForm loading={loading} onLogin={handleLogin} userType="admin" />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

function UserLoginForm({
  loading,
  onLogin,
}: {
  loading: boolean
  onLogin: (values: { username: string; password: string }, userType: 'user') => void
}) {
  const [form] = Form.useForm()

  return (
    <Form form={form} layout="vertical" onFinish={(values) => onLogin({ username: values.username, password: values.password }, 'user')}>
      <Form.Item
        name="username"
        label="用户名"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input placeholder="请输入用户名" />
      </Form.Item>
      <Form.Item
        name="password"
        label="密码"
        rules={[{ required: true, message: '请输入密码' }]}
      >
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

function StaffLoginForm({
  loading,
  onLogin,
  userType,
}: {
  loading: boolean
  onLogin: (values: { username: string; password: string }, userType: 'staff' | 'admin') => void
  userType: 'staff' | 'admin'
}) {
  const [form] = Form.useForm()

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => onLogin({ username: values.username, password: values.password }, userType)}
    >
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
