import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

export default function Home() {
  const navigate = useNavigate()
  const { token, userType } = useAuthStore()

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    if (userType === 'staff') {
      navigate('/staff/todos', { replace: true })
    } else if (userType === 'user') {
      navigate('/user/applications', { replace: true })
    } else if (userType === 'admin') {
      navigate('/admin/users', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [token, userType, navigate])

  return null
}
