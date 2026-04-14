import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

export default function Unauthorized() {
  const navigate = useNavigate()
  const { userType, logout } = useAuthStore()

  const handleGoHome = () => {
    if (userType === 'staff') {
      navigate('/staff/todos')
    } else if (userType === 'user') {
      navigate('/user/applications')
    } else {
      logout()
      navigate('/login')
    }
  }

  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您没有权限访问此页面"
      extra={
        <Button type="primary" onClick={handleGoHome}>
          返回首页
        </Button>
      }
    />
  )
}
