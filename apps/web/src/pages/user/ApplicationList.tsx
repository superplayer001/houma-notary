import { useEffect, useState } from 'react'
import { Table, Button, Space, Tag } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table/interface'
import { Link } from 'react-router-dom'
import { userApi } from '../../api/services'
import type { Application, ApplicationStatus } from '../../types'
import { APPLICATION_STATUS_MAP, BIZ_TYPE_OPTIONS } from '../../types'

export default function UserApplicationList() {
  const [data, setData] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 })

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const res = await userApi.listApplications({ page, pageSize })
      setData(res.data)
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: res.data.length }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(pagination.current, pagination.pageSize) }, [])

  const handleTableChange = (pagination: TablePaginationConfig) => {
    fetchData(pagination.current, pagination.pageSize)
  }

  const getBizTypeLabel = (value: string) => {
    const option = BIZ_TYPE_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : value
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 200 },
    { title: '业务类型', dataIndex: 'bizType', key: 'bizType', render: (bizType: string) => getBizTypeLabel(bizType) },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ApplicationStatus) => {
        const s = APPLICATION_STATUS_MAP[status] || { color: 'default', text: status }
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
        pagination={pagination}
        onChange={handleTableChange}
      />
    </div>
  )
}
