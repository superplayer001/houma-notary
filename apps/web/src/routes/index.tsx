import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

import Login from '../pages/Login'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'
import Unauthorized from '../pages/Unauthorized'
import Verify from '../pages/Verify'
import VideoSession from '../pages/VideoSession'
import UserLayout from '../pages/user/Layout'
import UserApplicationList from '../pages/user/ApplicationList'
import UserApplicationNew from '../pages/user/ApplicationNew'
import UserApplicationDetail from '../pages/user/ApplicationDetail'
import StaffLayout from '../pages/staff/Layout'
import StaffTodoList from '../pages/staff/TodoList'
import StaffApplicationDetail from '../pages/staff/ApplicationDetail'
import StaffCaseList from '../pages/staff/CaseList'
import StaffCaseDetail from '../pages/staff/CaseDetail'
import AdminLayout from '../pages/admin/Layout'
import AdminUsers from '../pages/admin/Users'
import AdminAudit from '../pages/admin/AuditLog'
import AdminSystemParams from '../pages/admin/SystemParams'
import AdminExternalDebug from '../pages/admin/ExternalDebug'

function ProtectedRoute({ children, allowedType }: { children: React.ReactNode; allowedType?: 'user' | 'staff' | 'admin' }) {
  const { token, userType } = useAuthStore()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (allowedType && userType !== allowedType) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/', element: <Home /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  { path: '/verify', element: <Verify /> },
  {
    path: '/user',
    element: <ProtectedRoute allowedType="user"><UserLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/user/applications" replace /> },
      { path: 'applications', element: <UserApplicationList /> },
      { path: 'applications/new', element: <UserApplicationNew /> },
      { path: 'applications/:id', element: <UserApplicationDetail /> },
    ],
  },
  {
    path: '/staff',
    element: <ProtectedRoute allowedType="staff"><StaffLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/staff/todos" replace /> },
      { path: 'todos', element: <StaffTodoList /> },
      { path: 'applications/:id', element: <StaffApplicationDetail /> },
      { path: 'cases', element: <StaffCaseList /> },
      { path: 'cases/:id', element: <StaffCaseDetail /> },
      { path: 'video-session', element: <VideoSession /> },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedType="admin"><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/admin/users" replace /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'audit', element: <AdminAudit /> },
      { path: 'params', element: <AdminSystemParams /> },
      { path: 'external', element: <AdminExternalDebug /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
