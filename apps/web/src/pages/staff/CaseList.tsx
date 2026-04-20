import { useEffect } from 'react'
import { Table, Tag, Empty } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table/interface'
import { Link } from 'react-router-dom'
import { useCases } from '../../hooks/useCases'
import { BIZ_TYPE_OPTIONS } from '../../types'
import type { CaseStatus } from '../../services/adapters/caseAdapter'

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  CREATED: { color: 'default', text: '已创建' },
  ASSIGNED: { color: 'blue', text: '已分配' },
  UNDER_REVIEW: { color: 'processing', text: '审查中' },
  WAITING_VIDEO: { color: 'purple', text: '待视频' },
  WAITING_SIGN: { color: 'cyan', text: '待签署' },
  WAITING_APPROVAL: { color: 'orange', text: '待审批' },
  APPROVED: { color: 'green', text: '已批准' },
  ISSUED: { color: 'green', text: '已出证' },
  COMPLETED: { color: 'green', text: '已完成' },
  VOIDED: { color: 'red', text: '已作废' },
  CLOSED: { color: 'default', text: '已关闭' },
  assigned: { color: 'blue', text: '已分配' },
  in_progress: { color: 'orange', text: '进行中' },
  completed: { color: 'green', text: '已完成' },
  voided: { color: 'red', text: '已作废' },
}

export default function StaffCaseList() {
  const { data, total, page, pageSize, loading, error, load } = useCases()

  useEffect(() => { load(1, 10) }, [])

  const handleTableChange = (p: TablePaginationConfig) => {
    load(p.current ?? 1, p.pageSize ?? 10)
  }

  const getBizTypeLabel = (value: string) => {
    const option = BIZ_TYPE_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : value
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
        { title: '案件编号', dataIndex: 'caseNo', key: 'caseNo', width: 160 },
        { title: '申请ID', dataIndex: 'applicationId', key: 'applicationId', width: 140 },
        { title: '业务类型', dataIndex: 'bizType', key: 'bizType', render: (v: string) => getBizTypeLabel(v) },
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          render: (s: CaseStatus) => {
            const m = STATUS_MAP[s] ?? { color: 'default', text: s }
            return <Tag color={m.color}>{m.text}</Tag>
          },
        },
        { title: '受理时间', dataIndex: 'acceptedAt', key: 'acceptedAt', width: 170 },
        { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
        {
          title: '操作',
          key: 'action',
          render: (_: unknown, record: { id: string }) => (
            <Link to={`/staff/cases/${record.id}`}>
              <span style={{ color: '#1677ff', cursor: 'pointer' }}>查看详情</span>
            </Link>
          ),
        },
      ]}
    />
  )
}
