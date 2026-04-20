import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd'
import type { MenuProps } from 'antd'
import { UserOutlined, LogoutOutlined, CheckSquareOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth'

const { Header, Sider, Content } = Layout

export default function StaffLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { username, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems: MenuProps['items'] = [
    {
      key: '/staff/todos',
      icon: <CheckSquareOutlined />,
      label: <Link to="/staff/todos">待办申请</Link>,
    },
    {
      key: '/staff/cases',
      icon: <UnorderedListOutlined />,
      label: <Link to="/staff/cases">案件列表</Link>,
    },
  ]

  const userMenuItems: MenuProps['items'] = [
    { key: 'username', label: username, disabled: true },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ]

  const selectedKey = menuItems.find((item) => item && location.pathname.startsWith(item.key as string))?.key as string || '/staff/todos'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          {collapsed ? '公' : '公证平台 - Staff'}
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
