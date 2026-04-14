import { useEffect, useState } from 'react'
import { Table, Button, Tag } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table/interface'
import { Link } from 'react-router-dom'
import { listCases } from '../../services/api/staff'
import type { Case, CaseStatus } from '../../types'
import { CASE_STATUS_MAP } from '../../types'

export default function StaffCaseList() {
  const [data, setData] = useState<Case[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 })

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const res = await listCases({ page, pageSize })
      setData(res.data)
      setPagination((prev) => ({ ...prev, current: page, pageSize, total: res.total }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(pagination.current, pagination.pageSize) }, [])

  const handleTableChange = (pagination: TablePaginationConfig) => {
    fetchData(pagination.current, pagination.pageSize)
  }

  return (
    <div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        pagination={pagination}
        onChange={handleTableChange}
        columns={[
          { title: 'ID', dataIndex: 'id', key: 'id', width: 200 },
          { title: '申请ID', dataIndex: 'applicationId', key: 'applicationId' },
          { title: '处理人ID', dataIndex: 'staffId', key: 'staffId' },
          { title: '业务类型', dataIndex: 'bizType', key: 'bizType' },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: CaseStatus) => {
              const s = CASE_STATUS_MAP[status] || { color: 'default', text: status }
              return <Tag color={s.color}>{s.text}</Tag>
            },
          },
          { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
          { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt' },
          {
            title: '操作',
            key: 'action',
            render: (_: unknown, record: Case) => (
              <Link to={`/staff/cases/${record.id}`}>
                <Button type="link">查看详情</Button>
              </Link>
            ),
          },
        ]}
      />
    </div>
  )
}
