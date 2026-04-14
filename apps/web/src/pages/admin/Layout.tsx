import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd'
import type { MenuProps } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined, TeamOutlined, FileTextOutlined, ApiOutlined } from '@ant-design/icons'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth'

const { Header, Sider, Content } = Layout

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { username, logout, userType } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems: MenuProps['items'] = [
    {
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: <Link to="/admin/users">用户管理</Link>,
    },
    {
      key: '/admin/audit',
      icon: <FileTextOutlined />,
      label: <Link to="/admin/audit">审计日志</Link>,
    },
    {
      key: '/admin/params',
      icon: <SettingOutlined />,
      label: <Link to="/admin/params">系统参数</Link>,
    },
    {
      key: '/admin/external',
      icon: <ApiOutlined />,
      label: <Link to="/admin/external">外部接口</Link>,
    },
  ]

  const userMenuItems: MenuProps['items'] = [
    { key: 'username', label: username, disabled: true },
    { key: 'role', label: <Tag color="red">{userType?.toUpperCase()}</Tag>, disabled: true },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ]

  const selectedKey = menuItems.find((item) => item && location.pathname.startsWith(item.key as string))?.key as string || '/admin/users'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          {collapsed ? '管' : '管理后台'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{username}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
