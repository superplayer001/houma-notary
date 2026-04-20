import { useEffect } from 'react'
import { Card, Table, Tag, Spin, Empty, Alert } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSystemParams } from '../../hooks/useSystemParams'
import type { SystemParam } from '../../services/adapters/paramsAdapter'

const typeColor: Record<string, string> = {
  string: 'blue',
  number: 'green',
  boolean: 'orange',
}

export default function AdminSystemParams() {
  const { data, loading, error, load } = useSystemParams()

  useEffect(() => {
    load()
  }, [load])

  const columns: ColumnsType<SystemParam> = [
    { title: '参数键', dataIndex: 'key', width: 240, render: (k: string) => <Tag>{k}</Tag> },
    { title: '参数值', dataIndex: 'value', width: 200 },
    { title: '类型', dataIndex: 'type', width: 80, render: (t: string) => <Tag color={typeColor[t] ?? 'default'}>{t}</Tag> },
    { title: '描述', dataIndex: 'description' },
    { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
  ]

  if (loading) return <Spin tip="加载系统参数..." />

  if (error) {
    return (
      <Alert
        type="error"
        message="加载失败"
        description={`后端暂未支持 /admin/system-params 接口，当前为 Mock 数据。错误：${error}`}
        showIcon
      />
    )
  }

  if (!data.length) return <Empty description="暂无系统参数" />

  return (
    <div>
      <Alert
        type="info"
        message="系统参数（只读）"
        description="本次仅实现读取展示，编辑保存功能待后端接口就绪后接入。"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Table
        rowKey="key"
        dataSource={data}
        columns={columns}
        pagination={false}
        size="small"
      />
    </div>
  )
}
