import client from './client'
import type { LoginRequest, LoginResponse, Application, Case, PaginationParams } from '../types'

export const authApi = {
  login: (data: LoginRequest) => client.post<LoginResponse>('/auth/login', data),
}

export const userApi = {
  listApplications: (params?: PaginationParams) => client.get<Application[]>('/user/applications', { params }),
  getApplication: (id: string) => client.get<Application>(`/user/applications/${id}`),
  createApplication: (data: Partial<Application>) => client.post<Application>('/user/applications', data),
  withdrawApplication: (id: string) => client.post<void>(`/user/applications/${id}/withdraw`),
  uploadMaterial: (applicationId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post(`/user/applications/${applicationId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const staffApi = {
  listTodos: (params?: PaginationParams) => client.get<Application[]>('/staff/todos', { params }),
  getApplication: (id: string) => client.get<Application>(`/staff/applications/${id}`),
  listCases: (params?: PaginationParams) => client.get<Case[]>('/staff/cases', { params }),
  getCase: (id: string) => client.get<Case>(`/staff/cases/${id}`),
  assignCase: (applicationId: string) => client.post<Case>(`/staff/applications/${applicationId}/assign`),
  supplementApplication: (id: string, reason: string) => client.post<void>(`/staff/applications/${id}/supplement`, { reason }),
  rejectApplication: (id: string, reason: string) => client.post<void>(`/staff/applications/${id}/reject`, { reason }),
  completeCase: (id: string, result: string) => client.post<Case>(`/staff/cases/${id}/complete`, { result }),
  voidCase: (id: string, reason: string) => client.post<Case>(`/staff/cases/${id}/void`, { reason }),
}
