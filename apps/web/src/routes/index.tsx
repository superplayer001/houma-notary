import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

import Login from '../pages/Login'
import UserApplicationList from '../pages/user/ApplicationList'
import UserApplicationNew from '../pages/user/ApplicationNew'
import UserApplicationDetail from '../pages/user/ApplicationDetail'
import StaffTodoList from '../pages/staff/TodoList'
import StaffApplicationDetail from '../pages/staff/ApplicationDetail'
import StaffCaseList from '../pages/staff/CaseList'
import StaffCaseDetail from '../pages/staff/CaseDetail'

function ProtectedRoute({ children, allowedType }: { children: React.ReactNode; allowedType?: 'user' | 'staff' }) {
  const { token, userType } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (allowedType && userType !== allowedType) return <Navigate to="/" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/user',
    element: <ProtectedRoute allowedType="user" />,
    children: [
      { path: 'applications', element: <UserApplicationList /> },
      { path: 'applications/new', element: <UserApplicationNew /> },
      { path: 'applications/:id', element: <UserApplicationDetail /> },
    ],
  },
  {
    path: '/staff',
    element: <ProtectedRoute allowedType="staff" />,
    children: [
      { path: 'todos', element: <StaffTodoList /> },
      { path: 'applications/:id', element: <StaffApplicationDetail /> },
      { path: 'cases', element: <StaffCaseList /> },
      { path: 'cases/:id', element: <StaffCaseDetail /> },
    ],
  },
  { path: '/', element: <Navigate to="/login" replace /> },
])
