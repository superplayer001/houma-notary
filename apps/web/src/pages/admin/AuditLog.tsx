import { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, Select, Drawer } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAuditLogs } from '../../hooks/useAuditLogs'
import type { AuditLogEntry } from '../../services/adapters/auditAdapter'

const ENTITY_TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '用户', value: 'user' },
  { label: '申请', value: 'application' },
  { label: '案件', value: 'case' },
  { label: '证书', value: 'certificate' },
  { label: '系统参数', value: 'system_param' },
]

const ACTION_OPTIONS = [
  { label: '全部', value: '' },
  { label: '登录', value: 'LOGIN' },
  { label: '提交', value: 'SUBMIT' },
  { label: '受理', value: 'ACCEPT' },
  { label: '出证', value: 'ISSUE' },
  { label: '作废', value: 'VOID' },
  { label: '更新', value: 'UPDATE' },
]

const OPERATOR_TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '用户', value: 'USER' },
  { label: '员工', value: 'STAFF' },
  { label: '管理员', value: 'ADMIN' },
]

const actionColor: Record<string, string> = {
  LOGIN: 'blue',
  SUBMIT: 'green',
  ACCEPT: 'cyan',
  ISSUE: 'purple',
  VOID: 'red',
  UPDATE: 'orange',
}

export default function AdminAudit() {
  const { data, total, page, pageSize, loading, load, refresh } = useAuditLogs()
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [operatorType, setOperatorType] = useState('')
  const [detailEntry, setDetailEntry] = useState<AuditLogEntry | null>(null)

  useEffect(() => {
    load(1, 10, { entity_type: entityType || undefined, action: action || undefined, operator_type: operatorType || undefined })
  }, [entityType, action, operatorType])

  const handleTableChange = (p: number, ps: number) => {
    load(p, ps, { entity_type: entityType || undefined, action: action || undefined, operator_type: operatorType || undefined })
  }

  const columns: ColumnsType<AuditLogEntry> = [
    { title: '时间', dataIndex: 'createdAt', width: 160 },
    { title: '操作类型', dataIndex: 'action', width: 100, render: (a: string) => <Tag color={actionColor[a] ?? 'default'}>{a}</Tag> },
    { title: '实体类型', dataIndex: 'entityType', width: 100 },
    { title: '实体ID', dataIndex: 'entityId', width: 120 },
    { title: '操作人类型', dataIndex: 'operatorType', width: 100 },
    { title: '操作人ID', dataIndex: 'operatorId', width: 100 },
    { title: '操作人', dataIndex: 'operatorName', width: 100 },
    { title: 'IP地址', dataIndex: 'ip', width: 130 },
    {
      title: '详情',
      key: 'detail',
      width: 80,
      render: (_: unknown, record: AuditLogEntry) => (
        <Button type="link" size="small" onClick={() => setDetailEntry(record)}>查看</Button>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select placeholder="实体类型" options={ENTITY_TYPE_OPTIONS} value={entityType} onChange={setEntityType} style={{ width: 120 }} allowClear />
        <Select placeholder="操作" options={ACTION_OPTIONS} value={action} onChange={setAction} style={{ width: 120 }} allowClear />
        <Select placeholder="操作人类型" options={OPERATOR_TYPE_OPTIONS} value={operatorType} onChange={setOperatorType} style={{ width: 120 }} allowClear />
        <Button onClick={refresh}>刷新</Button>
      </Space>
      <Table
        rowKey="id"
        dataSource={data}
        loading={loading}
        pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
        columns={columns}
        onChange={(pagination) => handleTableChange(pagination.current ?? 1, pagination.pageSize ?? 10)}
        size="small"
      />
      <Drawer title="日志详情" open={!!detailEntry} onClose={() => setDetailEntry(null)} width={500}>
        {detailEntry && (
          <div>
            <p><strong>ID：</strong>{detailEntry.id}</p>
            <p><strong>时间：</strong>{detailEntry.createdAt}</p>
            <p><strong>操作类型：</strong>{detailEntry.action}</p>
            <p><strong>实体类型：</strong>{detailEntry.entityType}</p>
            <p><strong>实体ID：</strong>{detailEntry.entityId}</p>
            <p><strong>操作人类型：</strong>{detailEntry.operatorType}</p>
            <p><strong>操作人ID：</strong>{detailEntry.operatorId}</p>
            <p><strong>操作人：</strong>{detailEntry.operatorName ?? '-'}</p>
            <p><strong>IP地址：</strong>{detailEntry.ip ?? '-'}</p>
            <p><strong>详情JSON：</strong></p>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}>
              {detailEntry.detailJson ? JSON.stringify(detailEntry.detailJson, null, 2) : '无'}
            </pre>
          </div>
        )}
      </Drawer>
    </div>
  )
}
