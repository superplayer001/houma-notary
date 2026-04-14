import { Card, Table, Tag, Button, Space } from 'antd'
import { PlusOutlined, SettingOutlined } from '@ant-design/icons'

interface AuditRecord {
  id: string
  userId: string
  username: string
  action: string
  target: string
  ip: string
  createdAt: string
}

const MOCK_AUDIT: AuditRecord[] = [
  { id: 'AUD-001', userId: 'U001', username: '张三', action: '登录系统', target: '/login', ip: '192.168.1.1', createdAt: '2024-01-16 10:00:00' },
  { id: 'AUD-002', userId: 'S001', username: '公证员01', action: '受理申请', target: 'APP-001', ip: '192.168.1.10', createdAt: '2024-01-16 11:00:00' },
  { id: 'AUD-003', userId: 'S001', username: '公证员01', action: '完成案件', target: 'CASE-001', ip: '192.168.1.10', createdAt: '2024-01-16 14:00:00' },
  { id: 'AUD-004', userId: 'A001', username: '系统管理员', action: '修改系统参数', target: 'CASE_EXPIRY_DAYS', ip: '192.168.1.100', createdAt: '2024-01-15 09:00:00' },
]

export default function AdminAudit() {
  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />}>导出日志</Button>
      </Space>
      <Table
        rowKey="id"
        dataSource={MOCK_AUDIT}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 100 },
          { title: '用户', dataIndex: 'username' },
          { title: '用户ID', dataIndex: 'userId', width: 100 },
          { title: '操作', dataIndex: 'action' },
          { title: '操作对象', dataIndex: 'target' },
          { title: 'IP地址', dataIndex: 'ip', width: 130 },
          { title: '时间', dataIndex: 'createdAt' },
        ]}
      />
    </div>
  )
}
