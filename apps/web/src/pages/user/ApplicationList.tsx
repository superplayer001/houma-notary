import { useEffect } from 'react'
import { Table, Button, Space, Tag, Empty } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table/interface'
import { Link } from 'react-router-dom'
import { useApplicationList } from '../../hooks/useApplicationList'
import type { Application, ApplicationStatus } from '../../types'
import { APPLICATION_STATUS_MAP } from '../../types'
import { getBizTypeLabel } from '../../services/adapters/applicationAdapter'

export default function UserApplicationList() {
  const { data, loading, pagination, fetch } = useApplicationList()

  useEffect(() => { fetch(pagination.current, pagination.pageSize) }, [])

  const handleTableChange = (p: TablePaginationConfig) => {
    fetch(p.current ?? 1, p.pageSize ?? 10)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 200 },
    {
      title: '业务类型',
      dataIndex: 'bizType',
      key: 'bizType',
      render: (bizType: string) => getBizTypeLabel(bizType),
    },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ApplicationStatus) => {
        const s = APPLICATION_STATUS_MAP[status] ?? { color: 'default', text: status }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Application) => (
        <Link to={`/user/applications/${record.id}`}>
          <Button type="link">查看详情</Button>
        </Link>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Link to="/user/applications/new">
          <Button type="primary">新建申请</Button>
        </Link>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ ...pagination, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` }}
        onChange={handleTableChange}
        locale={{ emptyText: <Empty description="暂无申请记录" /> }}
      />
    </div>
  )
}
