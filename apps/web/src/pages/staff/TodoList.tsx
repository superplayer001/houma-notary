import { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, message } from 'antd'
import { Link } from 'react-router-dom'
import { staffApi } from '../../api/services'
import type { Application } from '../../types'

export default function StaffTodoList() {
  const [data, setData] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await staffApi.listTodos()
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    pending: { color: 'orange', text: '待处理' },
    processing: { color: 'blue', text: '处理中' },
    completed: { color: 'green', text: '已完成' },
    rejected: { color: 'red', text: '已拒绝' },
  }

  return (
    <div>
      <Table rowKey="id" loading={loading} dataSource={data}
        columns={[
          { title: 'ID', dataIndex: 'id', key: 'id', width: 200 },
          { title: '用户ID', dataIndex: 'userId', key: 'userId' },
          { title: '类型', dataIndex: 'type', key: 'type' },
          { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
              const s = statusMap[status] || { color: 'default', text: status }
              return <Tag color={s.color}>{s.text}</Tag>
            },
          },
          { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
          {
            title: '操作',
            key: 'action',
            render: (_: unknown, record: Application) => (
              <Link to={`/staff/applications/${record.id}`}>
                <Button type="link">处理</Button>
              </Link>
            ),
          },
        ]}
      />
    </div>
  )
}
