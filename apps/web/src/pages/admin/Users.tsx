import { useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined, UserOutlined } from '@ant-design/icons'

interface UserRecord {
  id: string
  username: string
  phone: string
  type: 'user' | 'staff' | 'admin'
  status: 'active' | 'disabled'
  createdAt: string
}

const MOCK_USERS: UserRecord[] = [
  { id: 'U001', username: '张三', phone: '13800138001', type: 'user', status: 'active', createdAt: '2024-01-01 10:00:00' },
  { id: 'U002', username: '李四', phone: '13800138002', type: 'user', status: 'active', createdAt: '2024-01-02 10:00:00' },
  { id: 'S001', username: '公证员01', phone: '13900139001', type: 'staff', status: 'active', createdAt: '2023-06-01 10:00:00' },
  { id: 'S002', username: '公证员02', phone: '13900139002', type: 'staff', status: 'active', createdAt: '2023-06-15 10:00:00' },
  { id: 'A001', username: '系统管理员', phone: '13700137001', type: 'admin', status: 'active', createdAt: '2023-01-01 10:00:00' },
]

export default function AdminUsers() {
  const [data] = useState<UserRecord[]>(MOCK_USERS)

  const typeColor = (t: string) => t === 'admin' ? 'red' : t === 'staff' ? 'blue' : 'green'
  const statusColor = (s: string) => s === 'active' ? 'green' : 'default'

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />}>添加用户</Button>
      </Space>
      <Table
        rowKey="id"
        dataSource={data}
        pagination={false}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 100 },
          { title: '姓名', dataIndex: 'username' },
          { title: '手机号', dataIndex: 'phone' },
          {
            title: '角色',
            dataIndex: 'type',
            render: (t: string) => <Tag color={typeColor(t)}>{t.toUpperCase()}</Tag>,
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (s: string) => <Tag color={statusColor(s)}>{s === 'active' ? '正常' : '已禁用'}</Tag>,
          },
          { title: '创建时间', dataIndex: 'createdAt' },
          {
            title: '操作',
            key: 'action',
            render: () => (
              <Space>
                <Button type="link" size="small">编辑</Button>
                <Button type="link" size="small" danger>禁用</Button>
              </Space>
            ),
          },
        ]}
      />
    </div>
  )
}
