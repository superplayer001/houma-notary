import { Card, Table, Tag, Button, Space, Form, InputNumber, message } from 'antd'
import { SaveOutlined } from '@ant-design/icons'

interface SystemParam {
  key: string
  name: string
  value: string
  type: 'string' | 'number' | 'boolean'
  description: string
}

const PARAMS: SystemParam[] = [
  { key: 'CASE_EXPIRY_DAYS', name: '案件有效期（天）', value: '30', type: 'number', description: '案件从受理到完成的允许天数' },
  { key: 'MAX_MATERIAL_SIZE_MB', name: '材料大小限制（MB）', value: '20', type: 'number', description: '单次上传材料文件大小上限' },
  { key: 'ALLOW_WITHDRAW_AFTER_SUBMIT', name: '提交后允许撤回', value: 'false', type: 'boolean', description: '申请提交后是否允许用户撤回' },
  { key: 'REQUIRE_VIDEO_FOR_TYPES', name: '需双录的业务类型', value: 'will,property', type: 'string', description: '逗号分隔，需要双录公证的业务类型' },
  { key: 'CERTIFICATE_VALIDITY_YEARS', name: '证书有效期（年）', value: '永久', type: 'string', description: '公证证书的有效期限' },
]

export default function AdminSystemParams() {
  const handleSave = (key: string) => {
    message.success(`参数 ${key} 已保存（mock）`)
  }

  return (
    <div>
      {PARAMS.map((p) => (
        <Card key={p.key} size="small" style={{ marginBottom: 12 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space direction="vertical" size={0}>
              <strong>{p.name}</strong>
              <Space>
                <Tag>{p.key}</Tag>
                <span style={{ color: '#999', fontSize: 12 }}>{p.description}</span>
              </Space>
            </Space>
            <Space>
              <InputNumber
                value={p.type === 'number' ? Number(p.value) : undefined}
                style={{ width: 120 }}
              />
              <Button size="small" icon={<SaveOutlined />} onClick={() => handleSave(p.key)}>保存</Button>
            </Space>
          </Space>
        </Card>
      ))}
    </div>
  )
}
