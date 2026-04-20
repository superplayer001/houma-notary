import { useEffect } from 'react'
import { Table, Tag, Empty } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table/interface'
import { Link } from 'react-router-dom'
import { useStaffPendingApplications } from '../../hooks/useStaffPendingApplications'
import { BIZ_TYPE_OPTIONS } from '../../types'

export default function StaffTodoList() {
  const { data, total, page, pageSize, loading, error, load, refresh } = useStaffPendingApplications()

  useEffect(() => {
    load(1, 10)
  }, [])

  const handleTableChange = (p: TablePaginationConfig) => {
    load(p.current ?? 1, p.pageSize ?? 10)
  }

  const getBizTypeLabel = (value: string) => {
    const option = BIZ_TYPE_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : value
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      SUBMITTED: { color: 'blue', text: '已提交' },
      DRAFT: { color: 'default', text: '草稿' },
      SUPPLEMENT_REQUIRED: { color: 'orange', text: '待补件' },
      ACCEPTED: { color: 'green', text: '已受理' },
      REJECTED: { color: 'red', text: '已驳回' },
      WITHDRAWN: { color: 'default', text: '已撤回' },
    }
    return map[status.toUpperCase()] ?? { color: 'default', text: status }
  }

  if (error && data.length === 0) {
    return <Empty description="加载失败" />
  }

  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={data}
      pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      onChange={handleTableChange}
      columns={[
        { title: '申请编号', dataIndex: 'applicationNo', key: 'applicationNo', width: 160 },
        { title: '业务类型', dataIndex: 'bizType', key: 'bizType', render: (v: string) => getBizTypeLabel(v) },
        { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          render: (s: string) => {
            const m = getStatusLabel(s)
            return <Tag color={m.color}>{m.text}</Tag>
          },
        },
        { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', width: 170 },
        { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
        {
          title: '操作',
          key: 'action',
          render: (_: unknown, record: { id: string }) => (
            <Link to={`/staff/applications/${record.id}`}>
              <span style={{ color: '#1677ff', cursor: 'pointer' }}>处理</span>
            </Link>
          ),
        },
      ]}
    />
  )
}
