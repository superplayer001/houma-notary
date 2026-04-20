import { useState } from 'react'
import { Upload, Button, List, message, Space } from 'antd'
import { UploadOutlined, FileOutlined, DeleteOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { uploadMaterial } from '../services/api/applications'
import { isMockMode } from '../services/request'
import { mockUploadMaterial } from '../services/mock'
import type { Material } from '../types'

interface Props {
  applicationId: string
  materials: Material[]
  onSuccess: () => void
  disabled?: boolean
  showSubmitSupplement?: boolean
  onSubmitSupplement?: () => void
  submitLoading?: boolean
}

export default function FileUpload({
  applicationId,
  materials,
  onSuccess,
  disabled,
  showSubmitSupplement,
  onSubmitSupplement,
  submitLoading,
}: Props) {
  const [uploading, setUploading] = useState(false)

  const fileList: UploadFile[] = materials.map((m) => ({
    uid: m.id,
    name: m.name,
    status: 'done',
    url: m.url,
  }))

  const handleUpload = async ({ file }: { file: unknown }) => {
    const f = file as File
    setUploading(true)
    try {
      if (isMockMode()) {
        await new Promise(r => setTimeout(r, 500))
        mockUploadMaterial(applicationId, f.name)
      } else {
        await uploadMaterial(applicationId, f, 'general')
      }
      message.success('上传成功')
      onSuccess()
    } catch {
      message.error('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  return (
    <List
      itemLayout="horizontal"
      dataSource={materials}
      locale={{ emptyText: '暂无材料' }}
      renderItem={(item) => (
        <List.Item
          actions={
            !disabled
              ? [
                  <Button key="delete" type="text" danger icon={<DeleteOutlined />} onClick={() => message.info('删除功能待实现')}>
                    删除
                  </Button>,
                ]
              : []
          }
        >
          <List.Item.Meta
            avatar={<FileOutlined style={{ fontSize: 20, color: '#999' }} />}
            title={<a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a>}
            description={`上传时间: ${item.uploadedAt}`}
          />
        </List.Item>
      )}
      footer={
        <Space style={{ width: '100%' }} direction="vertical">
          {showSubmitSupplement && (
            <Button type="primary" onClick={onSubmitSupplement} loading={submitLoading} block>
              提交补件
            </Button>
          )}
          {!disabled && (
            <Upload
              name="file"
              customRequest={handleUpload}
              fileList={fileList}
              showUploadList={false}
              accept="*"
              disabled={uploading}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>上传材料</Button>
            </Upload>
          )}
        </Space>
      }
    />
  )
}
