import { Card, Result, Button, Space } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function VideoSession() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <Card>
        <Result
          status="info"
          title="双录功能开发中"
          subTitle="视频双录功能正在紧张开发中，敬请期待。"
          extra={
            <Space>
              <Button type="primary" onClick={() => navigate('/staff/cases')}>
                返回案件列表
              </Button>
            </Space>
          }
        />
      </Card>
    </div>
  )
}
