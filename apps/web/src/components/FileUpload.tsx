import { Upload, Button, List, message } from 'antd'
import { UploadOutlined, FileOutlined, DeleteOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { userApi } from '../api/services'
import type { Material } from '../types'

interface Props {
  applicationId: string
  materials: Material[]
  onSuccess: () => void
}

export default function FileUpload({ applicationId, materials, onSuccess }: Props) {
  const fileList: UploadFile[] = materials.map((m) => ({
    uid: m.id,
    name: m.name,
    status: 'done',
    url: m.url,
  }))

  const handleUpload = async ({ file, onSuccess, onError }: any) => {
    try {
      await userApi.uploadMaterial(applicationId, file)
      message.success('上传成功')
      onSuccess?.(null)
      onSuccess()
    } catch {
      message.error('上传失败')
      onError?.(new Error('上传失败'))
    }
  }

  return (
    <List
      itemLayout="horizontal"
      dataSource={materials}
      renderItem={(item) => (
        <List.Item
          actions={[
            <Button
              key="delete"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => message.info('删除功能待实现')}
            >
              删除
            </Button>,
          ]}
        >
          <List.Item.Meta
            avatar={<FileOutlined />}
            title={<a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a>}
            description={`上传时间: ${item.uploadedAt}`}
          />
        </List.Item>
      )}
      footer={
        <Upload
          name="file"
          customRequest={handleUpload}
          fileList={fileList}
          showUploadList={false}
          accept="*"
        >
          <Button icon={<UploadOutlined />}>上传材料</Button>
        </Upload>
      }
    />
  )
}
